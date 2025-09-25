# ⚡ PoS (Proof of Stake) in DAppNode

DAppNode provides comprehensive Proof of Stake infrastructure for Ethereum and other blockchain networks, offering a complete staking solution with execution clients, consensus clients, validators, and supporting services.

## 🏗️ Staking Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DAppNode Staking Stack                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Stakers    │  │  Web3Signer  │  │ Validator Tracker│  │
│  │      UI      │  │    & Brain   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Consensus   │  │   Execution  │  │   MEV Boost      │  │
│  │   Client     │◄─┤    Client    │  │   (Optional)     │  │
│  │ (Beacon)     │  │   (Engine)   │  └──────────────────┘  │
│  └──────────────┘  └──────────────┘                        │
├─────────────────────────────────────────────────────────────┤
│                     Staker Network                         │
│                    (Isolated Subnet)                       │
├─────────────────────────────────────────────────────────────┤
│                    DAppNode Core                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎛️ Stakers UI

### Configuration Management
The Stakers UI provides a unified interface for managing all staking components:

```typescript
// From packages/stakers/src/types.ts
interface StakerConfig {
  network: Network;                    // Ethereum, Gnosis, etc.
  executionClient: ExecutionClient;    // Geth, Nethermind, etc.
  consensusClient: ConsensusClient;    // Prysm, Lighthouse, etc.
  signerClient: SignerClient;          // Web3Signer configuration
  mevBoost: MevBoostConfig;           // MEV-Boost settings
  feeRecipient: string;               // Ethereum address for rewards
  graffiti: string;                   // Block graffiti message
}
```

### Supported Networks
DAppNode supports staking on multiple networks:

```typescript
// From packages/stakers/README.md
const SUPPORTED_NETWORKS = [
  'ethereum',    // Ethereum Mainnet
  'holesky',     // Ethereum Testnet
  'sepolia',     // Ethereum Testnet  
  'gnosis',      // Gnosis Chain
  'lukso',       // LUKSO Network
  'prater'       // Legacy testnet
];
```

### UI Components
- **Network Selection**: Choose blockchain network
- **Client Configuration**: Select and configure execution/consensus clients
- **Validator Management**: Import/export validator keys
- **Performance Monitoring**: Real-time staking metrics
- **Reward Tracking**: Earnings and performance analytics

## 🔐 Web3Signer & Brain Integration

### Web3Signer Architecture
Web3Signer provides secure key management for validators:

```typescript
// Web3Signer configuration
interface Web3SignerConfig {
  mode: 'keymanager' | 'slashing-protection';
  keystorePath: string;           // Path to keystore files
  passwordPath: string;           // Path to password files
  slashingProtectionPath: string; // Slashing protection database
  httpPort: number;               // API port (default: 9000)
  metricsPort: number;           // Metrics port
}
```

### Brain (Key Management UI)
The Brain provides a user-friendly interface for Web3Signer:

```typescript
// From packages/admin-ui/src/params.ts
export const brainSmooth = "http://brain.web3signer.dappnode/";

// Brain functionality includes:
interface BrainFeatures {
  keyImport: boolean;        // Import validator keystores
  keyGeneration: boolean;    // Generate new validator keys
  slashingProtection: boolean; // Manage slashing protection
  keyBackup: boolean;        // Backup/export keys
  performanceMetrics: boolean; // Validator performance tracking
}
```

### Key Security Features
- **Hardware Security Module (HSM)** support
- **Slashing Protection**: Prevents accidental slashing
- **Key Isolation**: Keys stored separately from validator clients
- **Audit Logging**: Complete audit trail for key operations

## 🔄 Validator Tracker

### Performance Monitoring
The Validator Tracker monitors validator performance across the network:

```typescript
// Validator tracking metrics
interface ValidatorMetrics {
  validatorIndex: number;        // Validator index on beacon chain
  publicKey: string;             // Validator public key
  balance: string;               // Current balance in ETH
  effectiveBalance: string;      // Effective balance for staking
  status: ValidatorStatus;       // Active, pending, exited, etc.
  
  // Performance metrics
  attestationEfficiency: number; // Percentage of successful attestations
  proposalCount: number;         // Number of blocks proposed
  missedAttestations: number;    // Number of missed attestations
  slashingStatus: boolean;       // Whether validator has been slashed
  
  // Rewards tracking
  totalRewards: string;          // Total rewards earned
  dailyRewards: string;          // Last 24h rewards
  apr: number;                   // Annual percentage rate
}
```

### Alerting System
Integrated with DAppNode's notification system:

```typescript
// Validator alert types
enum ValidatorAlertType {
  OFFLINE = 'validator_offline',
  MISSED_ATTESTATION = 'missed_attestation', 
  POOR_PERFORMANCE = 'poor_performance',
  BALANCE_DECREASE = 'balance_decrease',
  SLASHING_RISK = 'slashing_risk'
}

interface ValidatorAlert {
  type: ValidatorAlertType;
  validatorIndex: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
}
```

## ⚙️ Execution and Consensus Clients

### Execution Clients
DAppNode supports multiple execution clients:

```typescript
// From packages/stakers/src/executionClients.ts
interface ExecutionClient {
  name: string;
  image: string;
  ports: {
    p2p: number;      // P2P networking port
    rpc: number;      // JSON-RPC port
    ws: number;       // WebSocket port
    auth: number;     // Engine API port
  };
  syncModes: string[]; // Available sync modes
  resources: {
    memory: string;   // Memory requirements
    cpu: number;      // CPU requirements
    storage: string;  // Storage requirements
  };
}

const EXECUTION_CLIENTS: ExecutionClient[] = [
  {
    name: 'Geth',
    image: 'ethereum/client-go:latest',
    ports: { p2p: 30303, rpc: 8545, ws: 8546, auth: 8551 },
    syncModes: ['snap', 'full', 'light'],
    resources: { memory: '4GB', cpu: 2, storage: '750GB' }
  },
  {
    name: 'Nethermind', 
    image: 'nethermind/nethermind:latest',
    ports: { p2p: 30303, rpc: 8545, ws: 8546, auth: 8551 },
    syncModes: ['fast', 'full', 'archive'],
    resources: { memory: '8GB', cpu: 4, storage: '750GB' }
  }
  // Additional clients...
];
```

### Consensus Clients
Multiple consensus client options:

```typescript
// From packages/stakers/src/consensusClients.ts
interface ConsensusClient {
  name: string;
  image: string;
  ports: {
    p2p: number;      // P2P networking
    http: number;     // Beacon API
    metrics: number;  // Prometheus metrics
  };
  features: {
    builtin_validator: boolean; // Built-in validator
    mev_boost: boolean;         // MEV-Boost support
    checkpoint_sync: boolean;   // Checkpoint sync support
  };
}

const CONSENSUS_CLIENTS: ConsensusClient[] = [
  {
    name: 'Prysm',
    image: 'gcr.io/prysmaticlabs/prysm/beacon-chain:latest',
    ports: { p2p: 13000, http: 3500, metrics: 8080 },
    features: { builtin_validator: true, mev_boost: true, checkpoint_sync: true }
  },
  {
    name: 'Lighthouse',
    image: 'sigp/lighthouse:latest', 
    ports: { p2p: 9000, http: 5052, metrics: 5054 },
    features: { builtin_validator: true, mev_boost: true, checkpoint_sync: true }
  }
  // Additional clients...
];
```

### Client Coordination
Execution and consensus clients work together via the Engine API:

```typescript
// Engine API coordination
interface EngineApiConfig {
  executionEndpoint: string;    // "http://geth:8551"
  consensusEndpoint: string;    // "http://prysm:3500"
  jwtSecretPath: string;        // Shared JWT secret
  
  // Health monitoring
  heartbeatInterval: number;    // Health check interval
  timeoutThreshold: number;     // Connection timeout
}
```

## 🏛️ Beacon Backup Node

### High Availability Setup
For critical staking operations, DAppNode supports backup beacon nodes:

```typescript
// Backup node configuration
interface BackupNodeConfig {
  primary: {
    endpoint: string;           // Primary beacon node
    priority: number;           // Connection priority
  };
  backup: {
    endpoint: string;           // Backup beacon node
    priority: number;           // Lower priority
    fallbackDelay: number;      // Delay before fallback
  };
  
  // Health monitoring
  monitoring: {
    enabled: boolean;
    checkInterval: number;      // Health check frequency
    failureThreshold: number;   // Failures before switching
  };
}
```

### Failover Logic
Automatic failover between primary and backup nodes:

```typescript
// From packages/stakers/src/backupNode.ts
export class BeaconNodeManager {
  private primaryNode: BeaconNode;
  private backupNode: BeaconNode;
  private currentNode: BeaconNode;
  
  async monitorHealth(): Promise<void> {
    const primaryHealthy = await this.checkNodeHealth(this.primaryNode);
    
    if (!primaryHealthy && this.currentNode === this.primaryNode) {
      console.log('Primary node unhealthy, switching to backup');
      await this.switchToBackup();
    } else if (primaryHealthy && this.currentNode === this.backupNode) {
      console.log('Primary node recovered, switching back');
      await this.switchToPrimary();
    }
  }
  
  private async switchToBackup(): Promise<void> {
    // Update validator client configuration
    // Switch beacon node endpoint
    // Restart validator with new configuration
  }
}
```

## 🚀 MEV-Boost Integration

### MEV-Boost Architecture
Maximum Extractable Value (MEV) optimization through MEV-Boost:

```typescript
// MEV-Boost configuration
interface MevBoostConfig {
  enabled: boolean;
  relays: MevRelay[];           // List of MEV relays
  builderSelection: 'max_profit' | 'validator_preference';
  minBid: string;               // Minimum bid threshold in wei
  
  // Safety settings
  maxBuilderDelay: number;      // Maximum delay from builders
  fallbackToLocal: boolean;     // Fallback to local block building
}

interface MevRelay {
  name: string;                 // Relay name
  url: string;                  // Relay endpoint
  publicKey: string;            // Relay public key for verification
  trusted: boolean;             // Whether to trust this relay
}
```

### Builder Integration
Integration with block builders for optimized rewards:

```typescript
// Builder selection logic
export class BuilderSelector {
  async selectBest(
    slot: number,
    relays: MevRelay[],
    minBid: string
  ): Promise<BuilderBid | null> {
    const bids = await Promise.all(
      relays.map(relay => this.getBidFromRelay(relay, slot))
    );
    
    // Filter bids meeting minimum threshold
    const validBids = bids.filter(bid => 
      bid && BigNumber.from(bid.value).gte(minBid)
    );
    
    // Return highest value bid
    return validBids.reduce((best, current) => 
      BigNumber.from(current.value).gt(best.value) ? current : best
    );
  }
}
```

## 📊 Staking Performance Analytics

### Reward Tracking
Comprehensive reward and performance analytics:

```typescript
// Staking analytics interface
interface StakingAnalytics {
  validator: {
    totalValidators: number;
    activeValidators: number;
    totalStaked: string;        // Total ETH staked
    effectiveBalance: string;   // Effective balance
  };
  
  performance: {
    attestationRate: number;    // % successful attestations
    proposalRate: number;       // % successful proposals
    syncCommitteeParticipation: number;
    uptime: number;            // % uptime
  };
  
  rewards: {
    totalRewards: string;       // All-time rewards
    monthlyRewards: string;     // Last 30 days
    weeklyRewards: string;      // Last 7 days
    dailyRewards: string;       // Last 24 hours
    apr: number;               // Annual percentage rate
    consensusRewards: string;   // Consensus layer rewards
    executionRewards: string;   // Execution layer rewards (tips + mev)
  };
  
  network: {
    networkApr: number;         // Network average APR
    validatorRank: number;      // Performance ranking
    penalties: string;          // Total penalties incurred
  };
}
```

### Performance Optimization
Built-in tools for optimizing staking performance:

```typescript
// Performance optimization recommendations
interface OptimizationRecommendation {
  type: 'hardware' | 'configuration' | 'network';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  action: string;              // Recommended action
  estimatedImpact: string;     // Expected improvement
}

export async function generateOptimizationRecommendations(
  config: StakerConfig,
  metrics: StakingAnalytics
): Promise<OptimizationRecommendation[]> {
  const recommendations: OptimizationRecommendation[] = [];
  
  // Check attestation performance
  if (metrics.performance.attestationRate < 0.95) {
    recommendations.push({
      type: 'configuration',
      severity: 'warning',
      title: 'Low Attestation Rate',
      description: 'Attestation rate below 95%',
      action: 'Check beacon node sync status and network connectivity',
      estimatedImpact: '+2-5% rewards'
    });
  }
  
  // Additional checks...
  return recommendations;
}
```

## 🔗 Related Systems

- **[Networking](Networking.md)**: Staker network configuration and isolation
- **[Notifications](Notifications.md)**: Validator alerts and monitoring
- **[Admin UI](Admin-UI.md)**: Staking management interface
- **[Docker Integration](Docker-Integration.md)**: Container orchestration for staking services

---

> **Technical Implementation**: The staking system is implemented in `packages/stakers/` with support for multiple networks including Ethereum, Holesky, Sepolia, Gnosis, Lukso, and Prater. The system includes comprehensive validation, monitoring, and management capabilities.