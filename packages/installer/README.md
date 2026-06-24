# Installer

> DAppNode package installation, dependency resolution, and lifecycle management

## Overview

The Installer package is the core component responsible for installing, updating, and managing DAppNode packages. It handles complex dependency resolution, Docker image management, IPFS integration, and ensures safe package operations with rollback capabilities.

### Key Features

- **Package Installation**: Install packages from IPFS, registries, or local sources
- **Dependency Resolution**: Automatic resolution and installation of package dependencies
- **Version Management**: Handle package versions, updates, and compatibility checks
- **IPFS Integration**: Fetch packages and metadata from distributed IPFS network
- **Docker Integration**: Manage Docker images, containers, and compose files
- **Rollback Support**: Safe installation with automatic rollback on failures
- **Registry Support**: Work with multiple package registries and sources

## Core Functionality

### Package Installation
```typescript
import { DappnodeInstaller } from '@dappnode/installer';

const installer = new DappnodeInstaller(ipfsUrl, providers);

// Install a package with dependencies
await installer.install({
  name: "bitcoin.dnp.dappnode.eth",
  version: "latest"
});
```

### Dependency Management
```typescript
import { dappGet } from '@dappnode/installer';

// Resolve package dependencies
const request = await dappGet({
  name: "ethereum.dnp.dappnode.eth",
  version: "latest"
});

// Returns full dependency tree with installation plan
```

### Package Operations
```typescript
import { 
  packageInstall,
  packageRemove,
  downloadImages,
  loadImages
} from '@dappnode/installer';

// Install package with specific options
await packageInstall(installRequest, options);

// Remove package and cleanup
await packageRemove({ dnpName, deleteVolumes: false });

// Manage Docker images
await downloadImages(imageList);
await loadImages(tarPaths);
```

## API Reference

### Main Classes
- `DappnodeInstaller` - Main installer class with full functionality
- `PackageInstaller` - Core package installation logic
- `DependencyResolver` - Dependency resolution algorithms

### Installation Functions
- `packageInstall()` - Install packages with dependency resolution
- `packageRemove()` - Remove packages and cleanup resources
- `packageIsInstalling()` - Check if package is currently installing
- `rollbackPackages()` - Rollback failed installations

### Image Management
- `downloadImages()` - Download Docker images from registries
- `loadImages()` - Load images from tar archives
- `cleanImages()` - Clean up unused images after installation

### Package Resolution
- `dappGet()` - Main package resolution and fetching
- `fetchDnpRequest()` - Fetch package metadata and dependencies
- `getIpfsUrl()` - Get IPFS gateway URL configuration

### Installation Lifecycle
- `beforeInstall()` - Pre-installation checks and preparation
- `afterInstall()` - Post-installation configuration and cleanup
- `writeAndValidateFiles()` - File system operations during install
- `postInstallClean()` - Cleanup after successful installation

## Architecture

```
src/
├── calls/                 # API call handlers
├── dappGet/              # Package resolution and fetching
│   ├── aggregate/        # Dependency aggregation
│   └── resolve/          # Dependency resolution
├── installer/            # Core installation logic
└── dappnodeInstaller.ts  # Main installer class
```

### Installation Process

1. **Request Validation**: Validate package requests and parameters
2. **Dependency Resolution**: Build complete dependency tree
3. **Compatibility Check**: Verify system requirements and conflicts
4. **Resource Preparation**: Download images and prepare files
5. **Installation Execution**: Deploy containers and configure services
6. **Post-Install Setup**: Run setup scripts and health checks
7. **Cleanup**: Remove temporary files and unused resources

## Package Sources

The installer supports multiple package sources:

### IPFS Network
- **Distributed Storage**: Decentralized package distribution
- **Content Addressing**: Cryptographic verification of packages
- **Resilient**: Multiple gateways and redundancy

### Package Registries
- **DAppNode Registry**: Official package registry
- **Public Registry**: Community packages
- **Custom Registries**: Private or enterprise registries

### Local Sources
- **File System**: Install from local package files
- **Development**: Install in-development packages
- **Snapshots**: Install from backup or export files

## Dependency Resolution

The installer uses sophisticated dependency resolution:

### Resolution Algorithm
1. **Dependency Tree**: Build complete dependency graph
2. **Version Constraints**: Resolve version compatibility
3. **Conflict Detection**: Identify and resolve conflicts
4. **Optimization**: Minimize download and installation time

### Dependency Types
- **Required**: Must be installed for package to function
- **Optional**: Enhance functionality but not required
- **Peer**: Expected to be provided by environment
- **Dev**: Development-only dependencies (ignored in production)

## Error Handling and Recovery

### Installation Safety
- **Pre-flight Checks**: Validate before making changes
- **Atomic Operations**: All-or-nothing installation approach
- **Rollback Support**: Automatic rollback on failures
- **State Validation**: Verify system state after operations

### Error Types
- **Network Errors**: IPFS or registry connectivity issues
- **Validation Errors**: Invalid package data or signatures
- **Resource Conflicts**: Port, volume, or container conflicts
- **System Errors**: Insufficient resources or permissions

## Configuration

### IPFS Configuration
```typescript
interface IpfsConfig {
  gateway: string;          // IPFS gateway URL
  timeout: number;          // Request timeout
  retries: number;          // Retry attempts
}
```

### Installation Options
```typescript
interface InstallOptions {
  BYPASS_RESOLVER?: boolean;        // Skip dependency resolution
  BYPASS_CORE_RESTRICTION?: boolean; // Allow core package operations
  deleteVolumes?: boolean;          // Delete volumes on remove
  restart?: boolean;                // Restart after install
}
```

## Dependencies

### Internal Dependencies
- `@dappnode/dockerapi` - Docker container management
- `@dappnode/dockercompose` - Docker Compose operations
- `@dappnode/toolkit` - IPFS and registry integration
- `@dappnode/db` - State persistence and configuration
- `@dappnode/types` - TypeScript type definitions
- `@dappnode/utils` - Shared utility functions

### External Dependencies
- `docker` - Container runtime
- `ipfs` - Distributed file system
- `tar` - Archive processing
- `semver` - Version comparison and resolution

## Testing

```bash
yarn test           # Unit tests
yarn test:int       # Integration tests
```

### Test Coverage
- Unit tests for dependency resolution algorithms
- Integration tests with real IPFS and Docker
- Mock tests for error scenarios and edge cases
- End-to-end installation testing

## Performance Optimizations

- **Parallel Downloads**: Concurrent image and metadata fetching
- **Caching**: Intelligent caching of packages and metadata
- **Incremental Updates**: Only update changed components
- **Resource Pooling**: Efficient use of system resources

## Security Considerations

- **Package Verification**: Cryptographic verification of packages
- **Signature Validation**: Verify package signatures and authenticity
- **Sandbox Isolation**: Isolate package operations from host
- **Resource Limits**: Enforce resource constraints on packages

## Development

### Prerequisites
- Understanding of Docker and containerization
- Knowledge of IPFS and distributed systems
- Familiarity with package management concepts

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode compilation
yarn test           # Run unit tests
yarn test:int       # Run integration tests
```

### Adding New Features

1. **Installation Logic**: Add to `src/installer/` directory
2. **Resolution Logic**: Extend `src/dappGet/` for new resolution patterns
3. **API Endpoints**: Add calls to `src/calls/` directory
4. **Type Definitions**: Update types for new functionality
5. **Testing**: Add comprehensive tests for new features

## Troubleshooting

Common installation issues and solutions:

- **IPFS Connectivity**: Check IPFS gateway accessibility and configuration
- **Docker Issues**: Verify Docker daemon status and permissions
- **Dependency Conflicts**: Review dependency resolution logs
- **Resource Constraints**: Check available disk space and memory
- **Network Issues**: Verify internet connectivity and firewall settings

## Contributing

When contributing to the Installer package:

1. Understand the package installation lifecycle
2. Follow existing patterns for error handling and rollback
3. Add comprehensive tests for new installation scenarios
4. Consider performance impact of changes
5. Document new configuration options and APIs

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report installation issues in the main DNP_DAPPMANAGER repository
