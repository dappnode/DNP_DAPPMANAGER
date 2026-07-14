# Docker API

> Docker container and image management abstraction layer for DAppNode

## Overview

The Docker API package provides a comprehensive abstraction layer over Docker operations, specifically tailored for DAppNode package management. It handles container lifecycle management, image operations, volume management, and networking configuration through a simplified, type-safe interface.

### Key Features

- **Container Management**: Start, stop, restart, and monitor Docker containers
- **Image Operations**: Pull, build, inspect, and clean Docker images
- **Volume Management**: Create, inspect, and remove Docker volumes
- **Network Management**: Container networking and DNS configuration
- **File Transfer**: Copy files between host and containers
- **System Monitoring**: Container stats, health checks, and resource usage
- **Package Integration**: DAppNode-specific container orchestration

## Core Functionality

### Container Operations
```typescript
import { listContainers, dockerContainerStart, dockerContainerStop, dockerContainerRemove } from '@dappnode/dockerapi';

// List all containers with DAppNode-specific metadata
const containers = await listContainers();

// Start/stop containers
await dockerContainerStart(containerId);
await dockerContainerStop(containerId);
```

### Package Management
```typescript
import { listPackages, dockerComposeUp } from '@dappnode/dockerapi';

// Get structured package information
const packages = await listPackages();

// Deploy package using Docker Compose
await dockerComposeUp(composeFilePath, { serviceName: 'web' });
```

### Image Management
```typescript
import { getDockerImageManifest, loadImages, cleanOldImages } from '@dappnode/dockerapi';

// Get image metadata
const manifest = await getDockerImageManifest(imageName);

// Load images from tar files
await loadImages(['/path/to/image.tar']);

// Clean unused images
await cleanOldImages();
```

## API Reference

### Container Management
- `listContainers()` - List all Docker containers with metadata
- `parseContainerInfo()` - Parse Docker container data into DAppNode format
- `dockerContainerStart/Stop/Restart()` - Container lifecycle operations
- `dockerContainerRemove()` - Remove containers and cleanup

### Image Operations
- `getDockerImageManifest()` - Get image manifest and metadata
- `downloadImages()` - Pull images from registries
- `loadImages()` - Load images from tar archives
- `cleanOldImages()` - Remove unused and dangling images

### Volume Management
- `volumesData()` - Get volume information and usage stats
- `removeNamedVolume()` - Remove Docker volumes safely
- `getContainersAndVolumesToRemove()` - Calculate removal dependencies

### File Operations
- `fileTransfer()` - Copy files between host and containers
- `copyFileToDockerContainer()` - Direct file copy operations

### Compose Operations
- `dockerComposeUp()` - Deploy services using Docker Compose
- `dockerComposeDown()` - Stop and remove compose services
- `validateCompose()` - Validate Docker Compose files

## Architecture

The package is organized into logical modules:

```
src/
├── api/           # Core Docker API client operations
├── compose/       # Docker Compose integration
├── list/          # Container and package listing
├── utils/         # Helper functions and utilities
└── index.ts       # Public API exports
```

### Key Components

- **Docker Client**: Dockerode-based client with connection management
- **Container Parser**: Converts Docker data to DAppNode-specific formats
- **Compose Handler**: Docker Compose file processing and execution
- **Volume Manager**: Safe volume operations with dependency checking
- **Image Manager**: Image lifecycle and cleanup operations

## Dependencies

### Internal Dependencies
- `@dappnode/params` - Configuration parameters
- `@dappnode/utils` - Shared utility functions
- `@dappnode/hostscriptsservices` - Host system integration

### External Dependencies
- `dockerode` - Docker API client library
- `tar-stream` - TAR archive processing
- `data-uri-to-buffer` - Data URI handling
- `memoizee` - Function memoization for performance
- `lodash-es` - Utility functions

## Configuration

The Docker API package is configured through:

- **Docker Socket**: Unix socket connection (`/var/run/docker.sock`)
- **Default Networks**: DAppNode-specific network configuration
- **Volume Management**: Safe removal policies and dependency tracking
- **Image Registry**: Default registry configuration for image pulls

## Error Handling

The package provides comprehensive error handling:

- **Connection Errors**: Docker daemon connectivity issues
- **API Errors**: Docker API operation failures
- **Validation Errors**: Input validation and format checking
- **Resource Conflicts**: Container/volume dependency management

## Testing

```bash
yarn test           # Unit tests
yarn test:int       # Integration tests (requires Docker)
```

### Test Coverage
- Unit tests for pure functions and business logic
- Integration tests with real Docker daemon
- Mock tests for external API interactions
- Container lifecycle testing scenarios

## Performance Optimizations

- **Memoization**: Expensive operations are cached
- **Batch Operations**: Multiple operations grouped efficiently
- **Streaming**: Large file transfers use streams
- **Resource Pooling**: Efficient connection management

## Development

### Prerequisites
- Docker daemon running and accessible
- Node.js 20.x with TypeScript support
- Access to Docker socket (development environment)

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode compilation
yarn test           # Run unit tests
yarn test:int       # Run integration tests
```

### Adding New Features

1. Add new functions to appropriate modules (`api/`, `compose/`, etc.)
2. Export public APIs through `index.ts`
3. Add comprehensive TypeScript types
4. Include unit tests for business logic
5. Add integration tests for Docker operations

## Security Considerations

- **Socket Access**: Requires Docker socket access (security-sensitive)
- **Container Isolation**: Proper network and volume isolation
- **Resource Limits**: Container resource constraint enforcement
- **Image Validation**: Verify image integrity and sources

## Production Usage

In production, the Docker API package:

1. Runs with elevated privileges for Docker socket access
2. Manages DAppNode package containers exclusively
3. Enforces resource limits and security constraints
4. Provides monitoring and health check capabilities
5. Integrates with the broader DAppNode ecosystem

## Troubleshooting

Common issues and solutions:

- **Docker daemon not accessible**: Check socket permissions and Docker service status
- **Container conflicts**: Use dependency resolution in `getContainersAndVolumesToRemove()`
- **Image pull failures**: Verify network connectivity and registry access
- **Volume removal errors**: Check for active container dependencies

## Contributing

When contributing to the Docker API package:

1. Follow existing patterns for API client operations
2. Add proper error handling and validation
3. Include both unit and integration tests
4. Document any breaking changes to the API
5. Consider security implications of Docker operations

## Contact

**Maintainers:**
- @Marketen - Senior Developer
- @3alpha - Core Developer
- @dappnodedev - Core Team

**Issues:** Please report Docker-related issues in the main DNP_DAPPMANAGER repository
