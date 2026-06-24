# Stakers

> Ethereum staking infrastructure and multi-network validator management

## Overview

The Stakers package provides comprehensive Ethereum staking infrastructure for DAppNode, supporting multiple networks and validator configurations. It manages the complete staking stack including execution clients, consensus clients, MEV-Boost, and validator signers across different Ethereum networks.

### Key Features

- **Multi-Network Support**: Mainnet, Gnosis, Holesky, Sepolia, Lukso, and Prater testnet
- **Full Staking Stack**: Execution clients, consensus clients, MEV-Boost, and signers
- **Validator Management**: Key import, validation, and lifecycle management
- **MEV Integration**: Maximum Extractable Value optimization with MEV-Boost
- **Configuration Management**: Network-specific settings and user preferences
- **Monitoring**: Real-time staking performance and health metrics

## Supported Networks

The package supports the following Ethereum networks:

- **Mainnet** - Ethereum main network with full staking rewards
- **Gnosis Chain** - Layer 2 scaling solution with staking support
- **Holesky** - Primary Ethereum testnet for staking
- **Sepolia** - Additional testnet for development and testing
- **Lukso** - Lifestyle blockchain with Ethereum staking
- **Prater** - Deprecated testnet (legacy support)

## Architecture

The staking system is built around four main components:

```typescript
export class Execution extends StakerComponent    // Execution layer clients
export class Consensus extends StakerComponent    // Consensus layer clients  
export class MevBoost extends StakerComponent     // MEV-Boost relayers
export class Signer extends StakerComponent       // Validator signers
```

### Component Hierarchy

```
StakerComponent (Base Class)
├── Execution - Manages execution clients (Geth, Nethermind, etc.)
├── Consensus - Manages consensus clients (Lighthouse, Prysm, etc.)
├── MevBoost - MEV-Boost relay configuration and management
└── Signer - Validator key management and signing
```

## Core Functionality

### Staker Configuration
```typescript
import { getStakerConfig, setStakerConfig } from '@dappnode/stakers';

// Get current staking configuration for a network
const config = await getStakerConfig({ network: Network.Mainnet });

// Set staking configuration
await setStakerConfig({
  network: Network.Mainnet,
  executionClient: "geth.dnp.dappnode.eth",
  consensusClient: "lighthouse.dnp.dappnode.eth",
  mevBoost: true
});
```

### Component Management
```typescript
import { Execution, Consensus, MevBoost, Signer } from '@dappnode/stakers';

// Initialize staking components
const execution = new Execution(dappnodeInstaller);
const consensus = new Consensus(dappnodeInstaller);
const mevBoost = new MevBoost(dappnodeInstaller);
const signer = new Signer(dappnodeInstaller);

// Configure execution client
await execution.setTarget({
  network: Network.Mainnet,
  dnpName: "geth.dnp.dappnode.eth"
});
```

## API Reference

### Main Exports
- `Execution` - Execution layer client management
- `Consensus` - Consensus layer client management  
- `MevBoost` - MEV-Boost relay management
- `Signer` - Validator signer management

### Configuration Functions
- `getStakerConfig(params)` - Get current staker configuration for network
- `setStakerConfig(params)` - Set staker configuration for network

### Component Interface
Each staker component provides:
- `setTarget()` - Configure the active client for a network
- `getTarget()` - Get current active client
- `getUserSettings()` - Get user-specific configuration
- `setUserSettings()` - Update user configuration

## Database Integration

The package integrates with the DAppNode database system:

```typescript
// Network-specific database handlers
const DbHandlers = {
  [Network.Mainnet]: db.consensusClientMainnet,
  [Network.Gnosis]: db.consensusClientGnosis,
  [Network.Holesky]: db.consensusClientHolesky,
  // ... other networks
};
```

### Data Persistence
- **Client Selection**: Active client choices per network
- **User Settings**: Custom configuration and preferences
- **Validator Keys**: Secure storage of validator credentials
- **Performance Metrics**: Historical staking data and rewards

## Client Support

### Execution Clients
- **Geth** - Go Ethereum reference implementation
- **Nethermind** - .NET-based Ethereum client
- **Besu** - Java-based enterprise Ethereum client
- **Erigon** - Go-based high-performance client

### Consensus Clients
- **Lighthouse** - Rust-based consensus client
- **Prysm** - Go-based consensus client by Prysmatic Labs
- **Teku** - Java-based consensus client by ConsenSys
- **Nimbus** - Nim-based lightweight consensus client

### MEV-Boost Relays
- **Flashbots** - Leading MEV relay network
- **BloXroute** - High-performance relay network
- **Eden Network** - Community-driven MEV protection
- **Multiple Relays** - Support for relay redundancy

## Configuration

### Network Configuration
Each network has specific configuration requirements:

```typescript
interface StakerConfig {
  network: Network;
  executionClient?: string;
  consensusClient?: string;
  mevBoost?: boolean;
  feeRecipient?: string;
  graffiti?: string;
}
```

### User Settings
User-specific settings include:
- Fee recipient addresses
- Graffiti messages for blocks
- MEV-Boost preferences
- Performance monitoring settings

## Dependencies

### Internal Dependencies
- `@dappnode/installer` - Package installation and management
- `@dappnode/db` - Database operations and persistence
- `@dappnode/params` - Configuration parameters
- `@dappnode/utils` - Shared utilities and helpers
- `@dappnode/types` - TypeScript type definitions

### External Dependencies
- Ethereum client packages (Geth, Lighthouse, etc.)
- Validator client software
- MEV-Boost relay software

## Development

### Prerequisites
- Understanding of Ethereum 2.0 staking mechanism
- Knowledge of execution/consensus client architecture
- Familiarity with MEV-Boost and validator operations

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode compilation
yarn test           # Run unit tests (when implemented)
```

### Adding New Networks

1. **Add Network Type**: Update `Network` enum in types package
2. **Database Handler**: Add database integration for network
3. **Client Support**: Ensure execution/consensus clients support network
4. **Configuration**: Add network-specific configuration options
5. **Testing**: Validate functionality on new network

## Security Considerations

- **Validator Keys**: Secure storage and access control
- **Slashing Protection**: Prevent validator slashing conditions
- **Key Management**: Safe import/export of validator credentials
- **Network Isolation**: Proper network separation for different chains

## Performance Optimizations

- **Resource Management**: Efficient client resource allocation
- **Sync Optimization**: Fast initial sync and ongoing synchronization
- **MEV Optimization**: Maximize validator rewards through MEV-Boost
- **Hardware Utilization**: Optimize for different hardware configurations

## Monitoring and Metrics

- **Validator Performance**: Attestation success rates and rewards
- **Client Health**: Execution/consensus client synchronization status
- **Network Participation**: Peer connections and network health
- **MEV Revenue**: Track MEV-Boost revenue and optimization

## Troubleshooting

Common staking issues and solutions:

- **Sync Issues**: Check execution/consensus client connectivity
- **Validator Offline**: Verify signer configuration and key access
- **Poor Performance**: Review hardware resources and network connectivity
- **MEV Issues**: Check relay connectivity and configuration

## Contributing

When contributing to the Stakers package:

1. Understand Ethereum staking architecture and requirements
2. Follow existing patterns for component implementation
3. Add comprehensive testing for new features
4. Consider security implications of validator operations
5. Document network-specific configuration requirements

## Roadmap

- [ ] **Testing Implementation**: Comprehensive unit and integration tests
- [ ] **Performance Analytics**: Detailed staking performance metrics
- [ ] **Advanced MEV**: Enhanced MEV-Boost configuration options
- [ ] **Multi-Validator**: Support for multiple validator setups
- [ ] **Mobile Interface**: Mobile-optimized staking management

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer  
- @dappnodedev - Core Team

**Issues:** Please report staking-related issues in the main DNP_DAPPMANAGER repository
