# DAppNode Toolkit

> IPFS integration, smart contract interaction, and package management tools

## Overview

The DAppNode Toolkit is a comprehensive collection of modules and tools designed to interact with the Ethereum-based DAppNode ecosystem. It provides seamless integration with IPFS, Ethereum smart contracts, package registries, and content distribution networks, enabling developers to build robust applications on top of the DAppNode infrastructure.

### Key Features

- **IPFS Integration**: Interact with IPFS gateways and nodes for content distribution
- **Smart Contract Interface**: Type-safe interaction with DAppNode smart contracts
- **Package Registry**: Access to DAppNode package registries (`dnp` and `public`)
- **Content Verification**: Cryptographic verification of distributed content
- **Multi-Provider Support**: Redundant provider system for reliability
- **TheGraph Integration**: Efficient event querying and indexing

## Architecture

The toolkit is organized into several key modules:

```
src/
├── registry/          # Package registry management
├── repository/        # IPFS repository handling
├── directory/         # DAppNode directory smart contract
├── provider/          # Multi-provider Ethereum access
└── types.ts          # Shared type definitions
```

## Core Modules

### Registry Module
Manages DAppNode package registries with TheGraph integration:

```typescript
import { DappNodeRegistry } from '@dappnode/toolkit';

const registry = new DappNodeRegistry('dnp'); // or 'public'

// Get all packages in registry
const packages = await registry.getAllPackages();

// Get specific package information
const packageInfo = await registry.getPackage('bitcoin.dnp.dappnode.eth');
```

### Repository Module
IPFS-based package repository management:

```typescript
import { DappNodeRepository } from '@dappnode/toolkit';

const repo = new DappNodeRepository(provider);

// Get package releases
const releases = await repo.getReleases('bitcoin.dnp.dappnode.eth');

// Get specific version content
const manifest = await repo.getManifest('bitcoin.dnp.dappnode.eth', '1.0.0');

// Download package assets
const assets = await repo.getAssets('bitcoin.dnp.dappnode.eth', '1.0.0');
```

### Directory Module
DAppStore directory smart contract interaction:

```typescript
import { DappNodeDirectory } from '@dappnode/toolkit';

const directory = new DappNodeDirectory(provider);

// Get featured packages
const featured = await directory.getFeaturedPackages();

// Get package status in directory
const status = await directory.getPackageStatus('bitcoin.dnp.dappnode.eth');
```

### Multi-Provider System
Redundant Ethereum provider management:

```typescript
import { MultiUrlJsonRpcProvider } from '@dappnode/toolkit';

const providers = new MultiUrlJsonRpcProvider([
  { url: 'http://localhost:8545', type: 'local' },
  { url: 'https://mainnet.infura.io/v3/...', type: 'remote' }
]);

// Automatic failover and load balancing
const blockNumber = await providers.getBlockNumber();
```

## Package Registries

### DNP Registry (`dnp.dappnode.eth`)
- **Official Packages**: Maintained by DAppNode team
- **Quality Assurance**: Rigorous testing and validation
- **Core Services**: Essential DAppNode infrastructure packages
- **Curated Selection**: Carefully selected packages for stability

### Public Registry (`public.dappnode.eth`)
- **Community Packages**: Open to all developers
- **Diverse Ecosystem**: Wide range of blockchain applications
- **Innovation Hub**: Experimental and cutting-edge packages
- **Decentralized Publishing**: Anyone can publish packages

## IPFS Integration

### Content Distribution
```typescript
// IPFS content retrieval with multiple gateways
const content = await ipfs.get('/ipfs/QmHash123...');

// Content verification with DAG validation
const verified = await ipfs.getAndVerify('/ipfs/QmHash123...', {
  verifyDag: true,
  timeout: 30000
});
```

### Gateway Management
- **Multiple Gateways**: Redundant IPFS gateway support
- **Automatic Failover**: Switch to working gateways automatically
- **Performance Optimization**: Choose fastest available gateway
- **Content Validation**: Cryptographic verification of content

## Smart Contract Integration

### TypeChain Integration
Type-safe smart contract interactions using TypeChain-generated types:

```typescript
import { Registry__factory, Repository__factory } from '@dappnode/toolkit';

// Create typed contract instances
const registry = Registry__factory.connect(registryAddress, provider);
const repository = Repository__factory.connect(repoAddress, provider);

// Type-safe contract calls
const repoCount = await registry.getRepoCount();
const version = await repository.semanticVersions(versionArray);
```

### Smart Contract Types
- **Registry Contracts**: Package registry management
- **Repository Contracts**: Individual package repositories  
- **Directory Contract**: DAppStore package directory
- **ENS Integration**: Ethereum Name Service resolution

## TheGraph Integration

### Event Indexing
Efficient blockchain event querying using TheGraph:

```typescript
// Query package creation events
const newRepoEvents = await registry.queryNewRepoEvents({
  registryType: 'dnp',
  fromBlock: startBlock,
  toBlock: endBlock
});

// Get package update history
const updateHistory = await registry.getPackageHistory('bitcoin.dnp.dappnode.eth');
```

### Subgraph Endpoints
- **DNP Registry Subgraph**: Index dnp.dappnode.eth events
- **Public Registry Subgraph**: Index public.dappnode.eth events
- **Real-time Updates**: Live event streaming and notifications

## API Reference

### Registry API
```typescript
interface DappNodeRegistry {
  getAllPackages(): Promise<PackageInfo[]>;
  getPackage(name: string): Promise<PackageInfo>;
  searchPackages(query: string): Promise<PackageInfo[]>;
  getPackagesByCategory(category: string): Promise<PackageInfo[]>;
}
```

### Repository API
```typescript
interface DappNodeRepository {
  getReleases(name: string): Promise<ReleaseInfo[]>;
  getManifest(name: string, version: string): Promise<Manifest>;
  getAssets(name: string, version: string): Promise<AssetBundle>;
  getLatestVersion(name: string): Promise<string>;
}
```

### Directory API
```typescript
interface DappNodeDirectory {
  getFeaturedPackages(): Promise<FeaturedPackage[]>;
  getPackageStatus(name: string): Promise<DirectoryStatus>;
  isPackageWhitelisted(name: string): Promise<boolean>;
}
```

## Development

### Prerequisites
- Node.js 20.x (not browser compatible due to native file system modules)
- Understanding of Ethereum smart contracts and IPFS
- Knowledge of TypeScript and asynchronous programming

### Development Scripts
```bash
yarn build          # Compile TypeScript and generate types
yarn dev            # Watch mode for development
yarn test           # Run comprehensive test suite
yarn test:registry  # Test registry functionality
yarn test:directory # Test directory integration
yarn test:repository # Test IPFS repository operations
```

### Environment Setup
```typescript
// Configure IPFS gateways
const config = {
  ipfsGateways: [
    'https://ipfs.io',
    'https://gateway.pinata.cloud',
    'https://cloudflare-ipfs.com'
  ],
  ipfsTimeout: 30000,
  verifyContent: true
};
```

## Testing

The toolkit includes comprehensive testing for all modules:

### Registry Testing
- **TheGraph Integration**: Validate event querying and package discovery
- **Package Metadata**: Verify package information accuracy
- **Search Functionality**: Test package search and filtering

### Directory Testing  
- **Smart Contract Calls**: Validate directory contract interactions
- **Package Status**: Test package whitelist and feature status
- **Content Verification**: Ensure directory data integrity

### Repository Testing
- **IPFS Content**: Validate IPFS hash resolution and content retrieval
- **Version Management**: Test version resolution and manifest parsing
- **Asset Downloads**: Verify package asset downloading and verification

```bash
yarn test           # Run all tests
yarn test:int       # Integration tests with live contracts
yarn test:unit      # Unit tests for individual components
```

## Performance Optimizations

### Caching Strategy
- **Smart Contract Calls**: Cache contract call results
- **IPFS Content**: Cache frequently accessed content
- **Package Metadata**: Cache registry and directory data
- **Provider Responses**: Cache blockchain query results

### Network Optimization
- **Connection Pooling**: Reuse HTTP connections for efficiency
- **Request Batching**: Batch multiple requests when possible
- **Parallel Processing**: Concurrent IPFS and contract calls
- **Retry Logic**: Intelligent retry with exponential backoff

## Security Considerations

### Content Verification
- **IPFS Hash Validation**: Verify content matches expected hash
- **DAG Verification**: Validate IPFS DAG structure integrity
- **Signature Checking**: Verify package signatures when available
- **Smart Contract Validation**: Validate contract addresses and calls

### Provider Security
- **TLS Encryption**: Secure communication with providers
- **Authentication**: API key management for remote providers
- **Rate Limiting**: Prevent abuse of external services
- **Input Validation**: Sanitize all user inputs and contract data

## Contributing

### Development Guidelines
1. **Type Safety**: Maintain strict TypeScript typing
2. **Testing**: Add comprehensive tests for new features
3. **Documentation**: Update README and inline documentation
4. **Performance**: Consider performance impact of changes
5. **Compatibility**: Ensure Node.js compatibility (no browser support)

### Adding New Features
1. **Module Design**: Follow existing module patterns
2. **Error Handling**: Implement robust error handling
3. **Provider Integration**: Support multi-provider architecture
4. **Testing**: Add unit and integration tests
5. **Documentation**: Update API documentation

## Troubleshooting

Common issues and solutions:

### IPFS Issues
- **Gateway Timeouts**: Check gateway status and network connectivity
- **Content Not Found**: Verify IPFS hash and try alternative gateways
- **Slow Downloads**: Configure multiple gateways for redundancy

### Smart Contract Issues  
- **Provider Connectivity**: Verify Ethereum provider accessibility
- **Contract Addresses**: Ensure correct contract addresses for network
- **Gas Estimation**: Handle gas estimation failures gracefully

### TheGraph Issues
- **Subgraph Delays**: Account for indexing delays in queries
- **Query Limits**: Respect query size and rate limits
- **Network Differences**: Handle different subgraph endpoints per network

## Roadmap

Future development priorities:

- [ ] **Browser Compatibility**: Explore browser-compatible version
- [ ] **Additional Networks**: Support for more Ethereum networks
- [ ] **Enhanced Caching**: More sophisticated caching strategies
- [ ] **Performance Metrics**: Built-in performance monitoring
- [ ] **GraphQL Integration**: Enhanced TheGraph query capabilities

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team  
- @Marketen - Senior Developer
- @3alpha - Core Developer

**Issues:** Please report toolkit issues in the main DNP_DAPPMANAGER repository

## License

The DAppNode Toolkit is released under the MIT License. For more information, please refer to the `LICENSE` file.
