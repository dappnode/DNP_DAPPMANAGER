# Package Distribution

This document explains how DAppNode packages are discovered, downloaded, and installed through the decentralized distribution system.

## Overview

DAppNode's package distribution system combines Ethereum smart contracts for metadata and discovery with IPFS for content distribution. This creates a decentralized, censorship-resistant package management system that doesn't rely on centralized servers.

## Package Discovery Process

### 1. Registry Scanning

The discovery process begins by scanning both registry smart contracts for packages:

```typescript
// Example from packages/toolkit/src/registry/registry.ts
export class DappNodeRegistry {
  public async queryGraphNewRepos(): Promise<RegistryEntry[]> {
    const query = this.constructGraphQLQuery();
    const data = await request(this.graphEndpoint, query);
    return this.registry === "dnp" ? data.newRepos : data.newRepos;
  }
}
```

**Process:**
1. **TheGraph Query:** Query subgraphs for NewRepo events
2. **Event Processing:** Parse events to extract package names and repository addresses
3. **Registry Filtering:** Separate packages by registry type (dnp vs public)
4. **ENS Validation:** Ensure package names follow proper ENS format

### 2. Directory Filtering

Once packages are discovered from registries, they are filtered through the Directory contract:

```typescript
// Pseudocode for directory filtering
const allPackages = await registry.queryGraphNewRepos();
const whitelistedPackages = await directory.getWhitelistedPackages();
const featuredPackages = await directory.getFeaturedPackages();

const storePackages = allPackages.filter(pkg => 
  whitelistedPackages.includes(pkg.name)
);
```

**Directory Functions:**
- **Whitelist Check:** Only approved packages appear in DAppStore
- **Featured Status:** Determines which packages are highlighted
- **Ordering:** Controls package display order and categorization

### 3. Package Metadata Resolution

For each discovered package, metadata is resolved through ENS and Repository contracts:

```typescript
// Example from packages/toolkit/src/repository/apmRepository.ts
export class ApmRepository {
  public async getVersionAndIpfsHash({
    dnpNameOrHash,
    version = "*"
  }): Promise<ApmVersionRawAndOrigin> {
    const repoContract = await this.getRepoContract(dnpNameOrHash);
    const res = version && valid(version)
      ? await repoContract.getBySemanticVersion(this.convertToUint16Array(version))
      : await repoContract.getLatest();
    
    return {
      version: this.convertToSemverString(res.semanticVersion),
      contentUri: this.parseContentUri(res.contentURI),
      origin: dnpNameOrHash
    };
  }
}
```

## IPFS Content Structure

Each package version is stored on IPFS with a standardized directory structure:

```
/ipfs/QmHash.../
├── dappnode_package.json     # Package manifest
├── docker-compose.yml        # Container orchestration
├── avatar.png               # Package icon
├── getting-started.md       # User documentation
├── setup-wizard.json        # Configuration UI
├── notifications.yaml       # User alerts
├── grafana-dashboards/      # Monitoring dashboards
├── prometheus-targets.json  # Metrics configuration
└── image.txz               # Docker image archive
```

### Required Files

**dappnode_package.json (Manifest):**
```json
{
  "name": "ethereum.dnp.dappnode.eth",
  "version": "1.0.0",
  "description": "Ethereum mainnet node",
  "type": "service",
  "architectures": ["linux/amd64", "linux/arm64"],
  "image": {
    "path": "ethereum.dnp.dappnode.eth_1.0.0.tar.xz",
    "hash": "sha256:abc123...",
    "size": 150000000
  },
  "dependencies": {
    "bind.dnp.dappnode.eth": "latest"
  }
}
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  ethereum:
    image: ethereum.dnp.dappnode.eth:1.0.0
    container_name: DAppNodePackage-ethereum.dnp.dappnode.eth
    restart: unless-stopped
    ports:
      - "30303:30303"
    volumes:
      - ethereum_data:/data
volumes:
  ethereum_data: {}
```

### Optional Files

**setup-wizard.json:** Provides configuration UI
**notifications.yaml:** Defines user alerts and messages  
**getting-started.md:** User documentation and instructions
**grafana-dashboards/:** Monitoring and metrics dashboards
**prometheus-targets.json:** Metrics collection configuration

## Content Download Process

### 1. IPFS Hash Resolution

When a user selects a package for installation:

```typescript
// Example from packages/installer/src/dappnodeInstaller.ts
export class DappnodeInstaller extends DappnodeRepository {
  async getRelease(name: string, version?: string): Promise<PackageRelease> {
    const { contentUri } = await this.getVersionAndIpfsHash({
      dnpNameOrHash: name,
      version
    });

    const pkgRelease = await this.getPkgRelease({
      dnpNameOrHash: contentUri,
      trustedKeys: db.releaseKeysTrusted.get(),
      os: process.arch,
      version
    });

    return pkgRelease;
  }
}
```

### 2. Content Validation

Downloaded content undergoes several validation steps:

**Schema Validation:**
```typescript
private validateSchemas(pkgRelease: PackageRelease): void {
  validateManifestSchema(pkgRelease.manifest);
  validateDappnodeCompose(pkgRelease.compose, pkgRelease.manifest);
  if (pkgRelease.setupWizard) validateSetupWizardSchema(pkgRelease.setupWizard);
  if (pkgRelease.notifications) validateNotificationsSchema(pkgRelease.notifications);
}
```

**Content Integrity:**
- IPFS DAG verification ensures content hasn't been tampered with
- File hash validation against manifest specifications
- Docker image integrity checks

### 3. Asset Processing

Once validated, package assets are processed:

```typescript
// Metadata integration
pkgRelease.manifest = this.joinFilesInManifest({
  manifest: pkgRelease.manifest,
  SetupWizard: pkgRelease.setupWizard,
  disclaimer: pkgRelease.disclaimer,
  gettingStarted: pkgRelease.gettingStarted,
  grafanaDashboards: pkgRelease.grafanaDashboards,
  prometheusTargets: pkgRelease.prometheusTargets,
  notifications: pkgRelease.notifications
});

// Docker Compose processing
pkgRelease.compose = this.addCustomDefaultsAndLabels(
  pkgRelease.compose,
  pkgRelease.manifest,
  pkgRelease.avatarFile,
  pkgRelease.origin
);
```

## Multi-Architecture Support

DAppNode supports multiple CPU architectures:

### Architecture Detection

```typescript
public async getPkgRelease({
  dnpNameOrHash,
  trustedKeys,
  os = "x64", // Default to x64
  version
}: {
  dnpNameOrHash: string;
  trustedKeys: TrustedReleaseKey[];
  os?: NodeJS.Architecture;
  version?: string;
}): Promise<PackageRelease>
```

### Architecture-Specific Assets

Packages can include different Docker images for different architectures:
- `linux/amd64` - Standard x86_64 systems
- `linux/arm64` - ARM64 systems (including Apple Silicon)
- `linux/arm/v7` - 32-bit ARM systems

### Image Selection

The installer automatically selects the appropriate image based on the host architecture:

```typescript
private getArchTag = (arch: Architecture): string => 
  arch.replace(/\//g, "-");

// Example: "linux/arm64" becomes "linux-arm64"
```

## Dependency Resolution

### DAppGet System

Package dependencies are resolved using the DAppGet system:

```typescript
import { DappGetState, DappgetOptions, dappGet } from "./dappGet/index.js";

// Dependency resolution with dappGet
const dappGetState = await dappGet(packages, dappgetOptions);
```

**Features:**
- Recursive dependency resolution
- Version conflict detection
- Dependency graph optimization
- Circular dependency prevention

### Dependency Types

**Required Dependencies:** Must be installed for package to function
**Optional Dependencies:** Enhance functionality but not required
**Peer Dependencies:** Expected to be provided by the environment

## IPFS Integration

### Gateway Support

Multiple IPFS gateways provide redundancy:

```typescript
// Primary IPFS node connection
const primaryGateway = "http://ipfs.dappnode:5001";

// Fallback public gateways
const fallbackGateways = [
  "https://ipfs.io",
  "https://gateway.pinata.cloud",
  "https://cloudflare-ipfs.com"
];
```

### Content Verification

**DAG Verification:**
```typescript
// Verify content using IPFS DAG
const dagResult = await ipfs.dag.get(contentHash);
if (!dagResult || !dagResult.value) {
  throw new Error("Content verification failed");
}
```

**Trust Model:**
- Content-addressed storage ensures immutability
- IPFS hashes provide cryptographic verification
- Optional trusted keys for additional validation

### Performance Optimization

**Content Pinning:** Important packages pinned to local IPFS node
**Caching:** Frequently accessed content cached locally
**Parallel Downloads:** Multiple gateway requests for faster downloads

## Installation Process

### 1. Pre-Installation Checks

Before installation begins:
- System resource validation
- Port availability checking
- Dependency verification
- Version compatibility assessment

### 2. Docker Integration

Package installation leverages Docker:

```typescript
// Docker Compose deployment
import { ComposeEditor, setDappnodeComposeDefaults } from "@dappnode/dockercompose";

const composeEditor = new ComposeEditor(pkgRelease.compose);
composeEditor.setDappnodeDefaults();
await composeEditor.deploy();
```

### 3. Post-Installation

After successful installation:
- Service health checks
- Network configuration
- User notification
- Monitoring setup

## Error Handling and Resilience

### Network Failures

**IPFS Unavailable:**
- Fallback to public gateways
- Retry with exponential backoff
- User notification of delays

**Ethereum Node Unavailable:**
- Cached package metadata
- Offline mode for previously downloaded packages
- Background synchronization when connectivity restored

### Content Issues

**Invalid Package Structure:**
- Schema validation errors reported to user
- Installation aborted safely
- Cleanup of partial downloads

**Version Conflicts:**
- Dependency resolution failures
- Alternative version suggestions
- User choice for conflict resolution

### Recovery Mechanisms

**Partial Download Recovery:**
- Resume interrupted downloads
- Verify partial content integrity
- Clean up corrupted files

**Installation Rollback:**
- Restore previous package version
- Revert configuration changes
- Maintain system stability

## Monitoring and Metrics

### Package Usage Tracking

- Installation success/failure rates
- Download performance metrics
- Popular package statistics
- Error pattern analysis

### IPFS Network Health

- Gateway response times
- Content availability monitoring
- Network connectivity status
- Peer connection quality

### Performance Optimization

Based on metrics collected:
- Gateway prioritization
- Content pre-caching
- Resource allocation optimization
- User experience improvements

---

This document provides comprehensive coverage of DAppNode's package distribution system. For implementation details, refer to the source code in `packages/installer/` and `packages/toolkit/`.