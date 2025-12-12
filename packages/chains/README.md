# Chains

> Multi-blockchain integration and monitoring for DAppNode

## Overview

The Chains package provides unified blockchain integration for DAppNode, supporting multiple blockchain networks through a driver-based architecture. It monitors blockchain node synchronization status, provides chain-specific RPC interactions, and offers a consistent interface for different blockchain implementations.

### Key Features

- **Multi-Chain Support**: Ethereum, Gnosis Chain, and other EVM-compatible networks
- **Sync Monitoring**: Real-time synchronization status tracking
- **Driver Architecture**: Extensible system for adding new blockchain support
- **Error Handling**: Robust error reporting with retry mechanisms
- **Performance Optimization**: Efficient polling and caching strategies

## Supported Blockchains

The package currently supports:

- **Ethereum Mainnet**: Full node and validator support
- **Gnosis Chain**: Layer 2 scaling solution
- **Custom Networks**: Extensible architecture for additional chains

## Core Functionality

### Chain Data Retrieval
```typescript
import { getChainsData } from '@dappnode/chains';

// Get synchronization status for all active blockchain nodes
const chainsData = await getChainsData();

// Example response:
// [
//   {
//     dnpName: "geth.dnp.dappnode.eth",
//     syncing: false,
//     error: false,
//     progress: 1.0,
//     peers: 25
//   }
// ]
```

### Chain Driver System
The package uses a driver-based architecture to support different blockchain implementations:

```typescript
// Driver selection based on package name and configuration
const driverName = getChainDriverName(dnpPackage);
const chainData = await runWithChainDriver(dnpPackage, driverName);
```

## API Reference

### Main Functions
- `getChainsData()` - Retrieve sync status for all active blockchain nodes
- `getChainDriverName()` - Determine appropriate driver for a package
- `runWithChainDriver()` - Execute chain-specific operations
- `parseChainErrors()` - Standardize error messages across chains

### Driver Interface
Each blockchain driver must implement:
- Sync status checking
- Peer count monitoring
- Error state detection
- Performance metrics collection

## Architecture

```
src/
├── drivers/           # Blockchain-specific implementations
│   ├── ethereum/      # Ethereum mainnet driver
│   ├── gnosis/        # Gnosis Chain driver
│   └── index.ts       # Driver registry and dispatcher
├── getChainDriverName.ts  # Driver selection logic
├── utils.ts          # Shared utilities and error parsing
├── types.ts          # TypeScript type definitions
└── index.ts          # Main API exports
```

### Driver System

The driver architecture allows for:
- **Extensibility**: Easy addition of new blockchain support
- **Consistency**: Unified interface across different chains
- **Isolation**: Chain-specific logic contained in dedicated modules
- **Testing**: Independent testing of each blockchain implementation

## Chain Data Model

Each chain provides standardized data:

```typescript
interface ChainData {
  dnpName: string;        // Package name
  syncing: boolean;       // Is currently syncing
  error?: boolean;        // Error state
  message?: string;       // Status or error message
  progress?: number;      // Sync progress (0-1)
  peers?: number;         // Connected peer count
  network?: string;       // Network identifier
}
```

## Error Handling

The package provides comprehensive error handling:

- **Connection Errors**: Network connectivity issues
- **RPC Errors**: Blockchain RPC endpoint failures
- **Sync Errors**: Node synchronization problems
- **Configuration Errors**: Invalid node configuration

Error messages are parsed and standardized using `parseChainErrors()` for consistent user experience.

## Performance Considerations

- **Efficient Polling**: Optimized intervals to balance responsiveness and resource usage
- **Error Deduplication**: Prevents spam logging of repeated errors
- **Concurrent Queries**: Parallel processing of multiple blockchain nodes
- **Caching**: Smart caching of expensive RPC calls

## Dependencies

### Internal Dependencies
- `@dappnode/logger` - Logging infrastructure
- `@dappnode/dockerapi` - Container information and management
- `@dappnode/types` - Shared TypeScript types

### External Dependencies
- Blockchain-specific RPC clients (Ethereum, etc.)
- Network utilities for connectivity checking

## Configuration

Chain drivers are configured through:

- **Package Detection**: Automatic driver selection based on package names
- **RPC Endpoints**: Blockchain node RPC configuration
- **Polling Intervals**: Sync status check frequency
- **Error Thresholds**: Retry and timeout configuration

## Development

### Prerequisites
- Running blockchain nodes (for integration testing)
- Node.js 20.x with TypeScript support
- Access to blockchain RPC endpoints

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode compilation
yarn test           # Run unit tests
```

### Adding New Blockchain Support

1. **Create Driver**: Implement driver in `src/drivers/newchain/`
2. **Driver Interface**: Follow existing driver patterns
3. **Registration**: Add to driver registry in `src/drivers/index.ts`
4. **Detection Logic**: Update `getChainDriverName.ts` for package detection
5. **Testing**: Add comprehensive tests for new chain support

## Testing

```bash
yarn test           # Unit tests
```

### Test Coverage
- Driver functionality testing
- Error handling scenarios
- Chain data parsing validation
- Integration with mock blockchain responses

## Integration

The Chains package integrates with:

- **DAppManager**: Provides chain data for system dashboard
- **Admin UI**: Real-time sync status in web interface
- **Notifications**: Alerts for sync issues and errors
- **Monitoring**: System health and performance metrics

## Monitoring and Observability

- **Sync Status**: Real-time blockchain synchronization monitoring
- **Peer Connectivity**: Network peer count and connectivity health
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Metrics**: RPC response times and success rates

## Troubleshooting

Common issues and solutions:

- **No Chain Data**: Check if blockchain containers are running
- **Sync Issues**: Verify RPC endpoint accessibility and node health
- **Driver Errors**: Ensure correct driver mapping for package names
- **Performance Issues**: Review polling intervals and resource usage

## Contributing

When contributing to the Chains package:

1. Follow the driver architecture patterns
2. Add comprehensive error handling
3. Include unit tests for new drivers
4. Document chain-specific configuration requirements
5. Consider performance impact of new features

## Contact

**Maintainers:**
- @Marketen - Senior Developer
- @dappnodedev - Core Team

**Issues:** Please report blockchain integration issues in the main DNP_DAPPMANAGER repository
