# Smart Contracts Overview

This document provides detailed technical information about the three types of smart contracts that power DAppNode's repository management system: Directory, Registry, and Repository contracts.

## Directory Smart Contract

The Directory smart contract acts as a centralized whitelist and catalog management system for DAppNode packages.

### Purpose

- **Package Whitelisting:** Controls which packages appear in the DAppStore
- **Featured Packages:** Manages which packages are highlighted as "featured"
- **Package Ordering:** Determines the display order of packages in the store
- **Cross-Registry Support:** Works with both `dnp` and `public` registries

### Key Functions

The Directory contract provides functions to:
- Get the list of whitelisted packages
- Check if a package is featured
- Retrieve package positioning information
- Manage package categories and groupings

### Implementation

Located in `packages/toolkit/src/directory/`, the Directory module provides:
- Direct smart contract interaction
- Package filtering and validation
- Integration with the DAppStore UI

## Registry Smart Contracts

DAppNode operates two distinct registry smart contracts, each serving different governance and access models.

### DNP Registry (`dnp.dappnode.eth`)

**Smart Contract Address:** `0x266bfdb2124a68beb6769dc887bd655f78778923`

**Governance:** Controlled by DAppNode organization

**Purpose:**
- Official DAppNode packages
- Core infrastructure components
- Curated package ecosystem

**Package Examples:**
- `dappmanager.dnp.dappnode.eth`
- `bind.dnp.dappnode.eth`
- `ipfs.dnp.dappnode.eth`
- `ethereum.dnp.dappnode.eth`

### Public Registry (`public.dappnode.eth`)

**Smart Contract Address:** `0x9f85ae5aefe4a3eff39d9a44212aae21dd15079a`

**Governance:** Open to public participation

**Purpose:**
- Community-contributed packages
- Third-party applications
- Experimental packages

**Package Examples:**
- `rotki.public.dappnode.eth`
- `tornado.public.dappnode.eth`
- `custom-app.public.dappnode.eth`

### Registry Contract Functions

Both registry contracts implement the Aragon Package Manager (APM) interface:

```solidity
// Key functions available in registry contracts
function newRepo(string _name, address _dev, uint16[3] _initialSemanticVersion, 
                address _contractAddress, bytes _contentURI) returns (address)

function getRepo(bytes32 _name) view returns (address)

function CREATE_REPO_ROLE() view returns (bytes32)
```

### Events

**NewRepo Event:**
```solidity
event NewRepo(bytes32 indexed name, string name, address repo)
```

This event is emitted when a new package is registered and is crucial for package discovery.

### TheGraph Integration

Both registries are indexed by TheGraph subgraphs for efficient querying:

**DNP Registry Subgraph:**
- Indexes all `NewRepo` events from the DNP registry
- Provides structured data for package discovery
- Endpoint configured in `packages/toolkit/src/registry/params.ts`

**Public Registry Subgraph:**
- Indexes all `NewRepo` events from the public registry
- Enables efficient community package discovery
- Separate endpoint for public registry events

### Implementation Details

The registry implementation in `packages/toolkit/src/registry/` includes:

**DappNodeRegistry Class:**
```typescript
export class DappNodeRegistry {
  private registry: Registry;
  private graphEndpoint: string;
  private nameSuffix: string;

  constructor(registry: Registry) {
    this.registry = registry;
    if (registry === "dnp") this.graphEndpoint = dnpRegistryGraphEndpoint;
    else this.graphEndpoint = publicRegistryGraphEndpoint;
    
    this.nameSuffix = this.registry === "dnp" ? 
      ".dnp.dappnode.eth" : ".public.dappnode.eth";
  }

  public async queryGraphNewRepos(): Promise<RegistryEntry[]> {
    // GraphQL query to fetch all NewRepo events
  }
}
```

## Repository Smart Contracts

Each DAppNode package has its own individual Repository smart contract that manages versions and content hashes.

### Contract Address Resolution

Package ENS names resolve to their Repository contract addresses:
- `rotki.dnp.dappnode.eth` → Repository contract for Rotki package
- `ethereum.dnp.dappnode.eth` → Repository contract for Ethereum package

### Repository Contract ABI

The Repository contracts implement a standard ABI defined in `packages/toolkit/src/repository/params.ts`:

```typescript
export const repositoryAbi: Abi = [
  {
    constant: true,
    inputs: [{ name: "_semanticVersion", type: "uint16[3]" }],
    name: "getBySemanticVersion",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    type: "function"
  },
  {
    constant: true,
    inputs: [],
    name: "getLatest",
    outputs: [
      { name: "semanticVersion", type: "uint16[3]" },
      { name: "contractAddress", type: "address" },
      { name: "contentURI", type: "bytes" }
    ],
    type: "function"
  },
  // ... additional functions
];
```

### Key Repository Functions

**getLatest():**
- Returns the most recent version of the package
- Provides semantic version and IPFS content hash
- Used for automatic updates and initial installations

**getBySemanticVersion(uint16[3] version):**
- Retrieves specific version by semantic version array
- Enables installation of specific package versions
- Supports downgrade and version pinning scenarios

**newVersion():**
- Adds a new version to the package (admin only)
- Emits NewVersion event
- Links semantic version to IPFS content hash

**getVersionsCount():**
- Returns total number of published versions
- Used for pagination and version discovery

### Version Events

**NewVersion Event:**
```solidity
event NewVersion(uint256 indexed versionId, uint16[3] semanticVersion)
```

This event is emitted whenever a new package version is published and contains:
- **versionId:** Incremental version identifier
- **semanticVersion:** Semantic version as [major, minor, patch] array

### Semantic Versioning

Repository contracts use semantic versioning with a uint16[3] array format:
- `[1, 0, 0]` = v1.0.0
- `[2, 3, 1]` = v2.3.1
- `[0, 1, 0]` = v0.1.0

### Content URI Format

The `contentURI` field contains the IPFS hash pointing to package content:
- Format: Bytes representation of IPFS hash
- Content: Complete package bundle (manifest, docker image, compose file, etc.)
- Immutability: Content is immutable once published

### Implementation

The Repository interaction is handled by the `ApmRepository` and `DappnodeRepository` classes:

**ApmRepository (Base Class):**
```typescript
export class ApmRepository {
  public async getVersionAndIpfsHash({
    dnpNameOrHash,
    version = "*",
    contractAddress
  }): Promise<ApmVersionRawAndOrigin> {
    // ENS resolution and contract interaction
    // Version validation and retrieval
    // IPFS hash extraction
  }
}
```

**DappnodeRepository (Extended Class):**
```typescript
export class DappnodeRepository extends ApmRepository {
  public async getManifestFromDir(dnpName: string, version?: string): Promise<Manifest> {
    // IPFS content retrieval
    // Manifest parsing and validation
    // Content structure verification
  }

  public async getPkgRelease({
    dnpNameOrHash,
    trustedKeys,
    os = "x64",
    version
  }): Promise<PackageRelease> {
    // Complete package asset retrieval
    // Multi-architecture support
    // Content validation and parsing
  }
}
```

## Smart Contract Interaction Flow

### Package Discovery Flow

1. **Registry Query:** Query Registry contracts for NewRepo events
2. **ENS Resolution:** Resolve package ENS to Repository contract address
3. **Directory Check:** Verify package is whitelisted in Directory contract
4. **Package Listing:** Display available packages to user

### Version Discovery Flow

1. **Repository Query:** Query Repository contract for NewVersion events  
2. **Version Parsing:** Convert uint16[3] arrays to semantic version strings
3. **Content Hash:** Extract IPFS hashes for each version
4. **Version Selection:** Present available versions to user

### Package Installation Flow

1. **Version Selection:** User selects specific version or latest
2. **Repository Query:** Get IPFS content hash for selected version
3. **Content Download:** Retrieve package content from IPFS
4. **Validation:** Verify content structure and schemas
5. **Installation:** Deploy package using Docker Compose

## Error Handling

### Common Smart Contract Errors

**ENS Resolution Failures:**
- Package ENS doesn't resolve to valid contract
- Contract address is invalid or doesn't implement Repository ABI

**Version Not Found:**
- Requested semantic version doesn't exist
- Version format is invalid (not uint16[3])

**Content URI Issues:**
- IPFS hash is malformed or empty
- Content is not available on IPFS network

### Resilience Strategies

**Multiple Provider Support:**
- Fallback to different Ethereum nodes if primary fails
- Provider switching for improved reliability

**Event Caching:**
- Cache NewRepo and NewVersion events locally
- Reduce smart contract calls for frequently accessed data

**Content Verification:**
- Validate IPFS content matches expected package structure
- Use DAG verification for content integrity

## Development Tools

### TypeChain Integration

Smart contract types are generated using TypeChain:
```typescript
// Generated types for type-safe contract interaction
import { Repository } from '@dappnode/types/contracts';

const contract: Repository = new ethers.Contract(address, repositoryAbi, provider);
const latest = await contract.getLatest();
```

### Testing Infrastructure

Comprehensive tests cover:
- Registry event querying and parsing
- Repository version retrieval and validation
- IPFS content download and verification
- Error handling and edge cases

### Mock Contracts

Development environment includes:
- Mock registry contracts for testing
- Simulated event emission
- Local IPFS node for content testing

---

This document provides detailed technical information about DAppNode's smart contract infrastructure. For implementation examples, see the source code in `packages/toolkit/src/`.