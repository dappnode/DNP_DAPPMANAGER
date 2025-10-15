# DAppManager

> The core application and API server for DAppNode package management

## Overview

DAppManager is the central orchestration service for DAppNode, providing comprehensive package management, system administration, and blockchain integration capabilities. It serves as the backend API for the Admin UI and coordinates all DAppNode operations including Docker container management, package installation, system monitoring, and blockchain node management.

### Key Features

- **Package Management**: Install, update, remove, and monitor DAppNode packages
- **Docker Orchestration**: Manage Docker containers, volumes, networks, and images
- **Blockchain Integration**: Support for Ethereum execution/consensus clients and staking
- **System Administration**: Host management, networking, storage, and monitoring
- **Security**: Authentication, HTTPS proxying, and secure configuration management
- **Real-time Communication**: WebSocket-based updates and notifications

## Architecture

The DAppManager follows a modular architecture with the following components:

- **HTTP API Server**: Express.js server providing REST API endpoints
- **Call Handlers**: Business logic for all RPC operations (100+ endpoints)
- **Service Modules**: Specialized modules for Docker, networking, blockchain integration
- **Background Daemons**: Long-running tasks for monitoring and maintenance
- **Database Layer**: JSON-based persistent storage for configuration and state
- **Event System**: Inter-service communication using EventBus

## API Endpoints

The DAppManager exposes a comprehensive API with categories including:

- **Package Operations**: Install, remove, start/stop, configure packages
- **System Management**: Host info, updates, reboots, storage management
- **Docker Management**: Container lifecycle, volume management, network configuration
- **Blockchain Services**: Staking configuration, validator management, chain data
- **Security & Auth**: Password management, SSH, HTTPS portal configuration
- **Notifications**: Alert system with multiple delivery channels
- **Monitoring**: System stats, logs, diagnostics, and health checks

See [`src/calls/`](./src/calls) for the complete list of available endpoints.

## Dependencies

### Internal Dependencies
- `@dappnode/db` - Database operations and state management
- `@dappnode/dockerapi` - Docker API integration
- `@dappnode/installer` - Package installation logic
- `@dappnode/eventbus` - Inter-service communication
- `@dappnode/chains` - Blockchain integration
- `@dappnode/stakers` - Ethereum staking support
- All other DAppNode workspace packages

### External Dependencies
- `express` - HTTP server framework
- `socket.io` - Real-time WebSocket communication
- `dockerode` - Docker API client
- `ethers` - Ethereum library
- `bcryptjs` - Password hashing
- `systeminformation` - System monitoring

## Configuration

The DAppManager is configured through environment variables and the params system:

- **Port**: Default HTTP port 8080
- **IPFS**: Local IPFS node integration
- **Database**: JSON file-based storage
- **Docker**: Unix socket connection
- **Ethereum**: RPC endpoint configuration

## Development

### Prerequisites
- Node.js 20.x
- Docker daemon running
- DAppNode environment or development setup

### Scripts
```bash
yarn build          # Compile TypeScript
yarn start          # Start production server
yarn dev            # Development mode with hot reload
yarn test           # Run unit tests
yarn test:int       # Run integration tests
```

### Development Flow
1. Make changes to source files in `src/`
2. The build system will compile TypeScript to `dist/`
3. Use `yarn dev` for automatic rebuilding during development
4. Access API at `http://localhost:8080` (or configured port)

## Testing

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: End-to-end API testing with real Docker integration
- **Test Coverage**: Core business logic and API endpoints

```bash
yarn test           # Unit tests only
yarn test:int       # Integration tests (requires Docker)
yarn test:all       # Both unit and integration tests
```

## Production Deployment

The DAppManager runs as a Docker container in the DAppNode ecosystem:

1. Built using multi-stage Dockerfile
2. Deployed via Docker Compose
3. Integrated with other DAppNode core services
4. Manages host system through mounted volumes and sockets

## Contributing

When contributing to DAppManager:

1. Follow the existing API patterns in `src/calls/`
2. Add proper TypeScript types for new endpoints
3. Include unit tests for business logic
4. Update integration tests for API changes
5. Ensure Docker integration works correctly

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report issues in the main DNP_DAPPMANAGER repository
