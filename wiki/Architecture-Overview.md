# 🏗️ Architecture Overview

DAppNode Manager is a sophisticated blockchain infrastructure platform built on a microservices architecture. This overview provides a high-level understanding of how all components work together to deliver a seamless blockchain node management experience.

## 🎯 System Purpose

DAppNode Manager serves as the central orchestration system for blockchain infrastructure, providing:

- **Package Management**: Install, update, and manage blockchain applications
- **Container Orchestration**: Docker-based service management
- **Network Management**: Secure networking and connectivity
- **User Interface**: Web-based administration and monitoring
- **Staking Infrastructure**: Proof-of-Stake validator services
- **Monitoring & Alerts**: System health and performance tracking

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DAppNode Manager                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │                 │    │                 │    │                         │ │
│  │    Admin UI     │◄──►│   DAppManager   │◄──►│    User Packages       │ │
│  │   (Frontend)    │    │    (Backend)    │    │   (Blockchain Apps)     │ │
│  │  React + Redux  │    │  Node.js + API  │    │  Docker Containers      │ │
│  │                 │    │                 │    │                         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
│           │                       │                         │               │
│           ▼                       ▼                         ▼               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐ │
│  │                 │    │                 │    │                         │ │
│  │   Core Services │    │    Daemons      │    │      Networking         │ │
│  │  Bind, WiFi,    │    │   Auto-Update   │    │   Docker Networks       │ │
│  │  HTTPS Portal   │    │   Monitoring    │    │   DNS, Port Forward     │ │
│  │                 │    │   Stakers       │    │                         │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────────┤
│                          Docker Runtime                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                       Host Operating System                                │
│                      (Ubuntu/Debian Linux)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📦 Package Architecture

DAppNode uses a **monorepo structure** with 25+ TypeScript packages:

### Core Packages
```
packages/
├── dappmanager/     # Main application entry point
├── admin-ui/        # React web interface
├── installer/       # Package installation engine
├── dockerApi/       # Docker integration layer
├── toolkit/         # IPFS and blockchain utilities
└── stakers/         # Ethereum staking infrastructure
```

### Supporting Packages
```
packages/
├── common/          # Shared validation & schemas
├── types/           # TypeScript type definitions
├── db/              # Database layer
├── eventBus/        # Inter-service communication
├── notifications/   # Alert and notification system
├── logger/          # Centralized logging
├── params/          # Configuration parameters
└── utils/           # Shared utilities
```

### Infrastructure Packages
```
packages/
├── daemons/         # Background services
├── dockerCompose/   # Docker Compose management
├── httpsPortal/     # HTTPS proxy and certificates
├── hostScriptsServices/ # Host system integration
└── chains/          # Multi-blockchain support
```

## 🔄 Data Flow Architecture

### Request Flow
```
User Input (Browser)
     │
     ▼
┌─────────────────┐     HTTP/WebSocket     ┌─────────────────┐
│   Admin UI      │◄──────────────────────►│  DAppManager    │
│   (React App)   │                        │   (Node.js)     │
└─────────────────┘                        └─────────────────┘
                                                   │
                            API Calls              ▼
                       ┌─────────────────────────────────────┐
                       │           Modules                   │
                       ├─────────────────────────────────────┤
                       │ installer/ │ dockerApi/ │ stakers/ │
                       │ toolkit/   │ daemons/   │ chains/  │
                       └─────────────────────────────────────┘
                                         │
                                         ▼
                               ┌─────────────────┐
                               │  Docker Engine  │
                               │   Containers    │
                               └─────────────────┘
```

### Event-Driven Architecture
```typescript
// From packages/eventBus/
interface EventBus {
  emit(event: string, data: any): void;
  on(event: string, handler: Function): void;
  off(event: string, handler: Function): void;
}

// Example events
enum DAppNodeEvents {
  PACKAGE_INSTALLED = 'package.installed',
  PACKAGE_UPDATED = 'package.updated',
  VALIDATOR_OFFLINE = 'validator.offline',
  SYSTEM_ALERT = 'system.alert',
  NETWORK_CHANGED = 'network.changed'
}
```

## 🌐 Network Architecture

### Container Networking
```
┌─────────────────────────────────────────────────────────────┐
│                    Network Topology                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Internet ◄──── Router ◄──── Host System ◄──── Containers  │
│                    │              │              │         │
│                    │              │              ▼         │
│                    │              │    ┌─────────────────┐ │
│                    │              │    │ dncore_network  │ │
│                    │              │    │ 172.33.0.0/16   │ │
│                    │              │    │                 │ │
│                    │              │    │ ┌─────────────┐ │ │
│                    │              │    │ │ DAppManager │ │ │
│                    │              │    │ │ 172.33.1.7  │ │ │
│                    │              │    │ └─────────────┘ │ │
│                    │              │    │                 │ │
│                    │              │    │ ┌─────────────┐ │ │
│                    │              │    │ │ Bind DNS    │ │ │
│                    │              │    │ │ 172.33.1.2  │ │ │
│                    │              │    │ └─────────────┘ │ │
│                    │              │    │                 │ │
│                    │              │    │ ┌─────────────┐ │ │
│                    │              │    │ │ User Pkgs   │ │ │
│                    │              │    │ │ 172.33.x.x  │ │ │
│                    │              │    │ └─────────────┘ │ │
│                    │              │    └─────────────────┘ │
│                    │              │                        │
│                    ▼              ▼                        │
│              ┌─────────────────────────────────────────┐   │
│              │         Host Network Stack             │   │
│              │      (iptables, routing, etc.)        │   │
│              └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Service Discovery
- **DNS Resolution**: Bind provides internal name resolution
- **Network Aliases**: Containers accessible by predictable names
- **Port Management**: Automatic port allocation and forwarding

## 💾 Data Architecture

### Storage Strategy
```
Host File System
├── /usr/src/dappnode/           # DAppNode application data
│   ├── DNCORE/                  # Core package data
│   ├── packages/                # User package data
│   └── config/                  # Configuration files
├── /var/lib/docker/             # Docker runtime data
│   ├── containers/              # Container data
│   ├── volumes/                 # Persistent volumes
│   └── networks/                # Network configurations
└── /opt/dappnode/               # DAppNode system files
    ├── logs/                    # Application logs
    ├── backups/                 # Configuration backups
    └── certificates/            # SSL certificates
```

### Database Design
```typescript
// From packages/db/
interface DatabaseSchema {
  packages: PackageRecord[];       // Installed packages
  settings: SettingsRecord[];     // User preferences
  notifications: NotificationRecord[]; // Alert history
  validators: ValidatorRecord[];   // Staking validators
  metrics: MetricsRecord[];       // Performance data
}

// File-based storage with JSON
const DB_FILES = {
  packages: 'packages.json',
  settings: 'settings.json',
  notifications: 'notifications.json',
  validators: 'validators.json'
};
```

## 🔐 Security Architecture

### Multi-Layer Security
```
┌─────────────────┐
│   User Layer    │  ← Authentication, Authorization
├─────────────────┤
│  Application    │  ← Input validation, HTTPS, CSRF protection
├─────────────────┤
│   Container     │  ← Isolation, resource limits, read-only filesystems
├─────────────────┤
│    Network      │  ← Firewall, network segmentation, encrypted communication
├─────────────────┤
│  Host System    │  ← OS hardening, user permissions, system monitoring
└─────────────────┘
```

### Security Features
- **Container Isolation**: Each package runs in isolated containers
- **Network Segmentation**: Core services separated from user packages
- **Certificate Management**: Automatic HTTPS certificate provisioning
- **Firewall Configuration**: UFW-based firewall management
- **User Authentication**: Session-based authentication with bcrypt

## ⚡ Performance Architecture

### Scalability Design
```typescript
// Resource allocation strategy
interface ResourceAllocation {
  cpu: {
    corePackages: '2-4 cores';    // System-critical services
    userPackages: '1-2 cores';   // User applications
    monitoring: '0.5 cores';     // System monitoring
  };
  memory: {
    corePackages: '2-4 GB';      // System services
    userPackages: '1-8 GB';      // Variable based on package
    monitoring: '512 MB';        // Monitoring overhead
  };
  storage: {
    system: '10-20 GB';          // OS and DAppNode core
    packages: '100GB - 2TB';     // Blockchain data
    logs: '1-5 GB';              // Log retention
  };
}
```

### Performance Optimizations
- **Lazy Loading**: UI components loaded on demand
- **Caching**: IPFS content and API responses cached
- **Background Processing**: Long-running tasks handled by daemons
- **Resource Monitoring**: Automatic resource usage tracking

## 🔄 Update Architecture

### Update Pipeline
```
Registry Check → Version Compare → Download → Validate → Install → Verify
     │                │              │          │          │         │
     ▼                ▼              ▼          ▼          ▼         ▼
┌─────────┐    ┌─────────────┐    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Ethereum │    │   Semver    │    │  IPFS  │ │Schema  │ │Docker  │ │Health  │
│Contract │    │ Comparison  │    │Download│ │Check   │ │Deploy  │ │Check   │
└─────────┘    └─────────────┘    └────────┘ └────────┘ └────────┘ └────────┘
```

### Update Types
- **Patch Updates**: Automatic security and bug fixes
- **Minor Updates**: Optional feature updates
- **Major Updates**: Manual approval required
- **Core Updates**: System-wide updates with special handling

## 🎛️ Administration Architecture

### Management Interface
```
Web Browser ◄──── HTTPS ◄──── Admin UI (React)
     │                              │
     │ User interactions            │ State management
     │                              │
     ▼                              ▼
API Calls ──────► DAppManager ◄──── Event Bus
                       │                │
                       │ Module calls   │ Events
                       │                │
                       ▼                ▼
                 ┌─────────────────────────┐
                 │       Modules           │
                 │ installer | dockerApi   │
                 │ stakers   | daemons    │
                 │ toolkit   | chains     │
                 └─────────────────────────┘
```

### API Design
```typescript
// From packages/types/src/routes.ts
interface DAppManagerAPI {
  // Package management
  packageInstall(req: InstallPackageRequest): Promise<void>;
  packageRemove(req: RemovePackageRequest): Promise<void>;
  packageGet(req: GetPackageRequest): Promise<PackageInfo>;
  
  // System management
  systemInfoGet(): Promise<SystemInfo>;
  systemResourcesGet(): Promise<ResourceUsage>;
  
  // Staking management
  stakerConfigGet(network: Network): Promise<StakerConfig>;
  stakerConfigSet(config: StakerConfig): Promise<void>;
}
```

## 🔗 Integration Points

### External Integrations
- **Ethereum Mainnet**: Package registry and metadata
- **IPFS Network**: Content distribution and storage
- **Docker Hub**: Container image registry
- **Let's Encrypt**: SSL certificate provisioning
- **Cloud Providers**: VPS and cloud deployment

### Blockchain Integration
```typescript
// Multi-blockchain support
interface BlockchainClient {
  network: string;              // ethereum, gnosis, lukso, etc.
  client: string;               // geth, nethermind, prysm, etc.
  syncStatus(): Promise<SyncStatus>;
  peers(): Promise<PeerInfo[]>;
  blockHeight(): Promise<number>;
}
```

## 📊 Monitoring Architecture

### Observability Stack
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Metrics       │    │      Logs       │    │     Traces      │
│  Collection     │    │   Aggregation   │    │   Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Prometheus     │    │    Journald     │    │  OpenTelemetry  │
│   (Optional)    │    │  System Logs    │    │   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DAppNode Admin UI                           │
│                 Dashboard & Alerts                             │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### 1. **Decentralization First**
- No single points of failure
- Peer-to-peer content distribution
- Blockchain-based package registry

### 2. **User Experience Focus**
- One-click installations
- Intuitive web interface  
- Comprehensive monitoring

### 3. **Security by Design**
- Container isolation
- Network segmentation
- Automatic security updates

### 4. **Modular Architecture**
- Loosely coupled components
- Clear separation of concerns
- Extensible plugin system

### 5. **Reliability & Resilience**
- Automatic failover
- Health monitoring
- Graceful error handling

## 🔗 Related Documentation

- **[Package Installer & Repository](Package-Installer-Repository.md)**: Deep dive into package management
- **[Admin UI](Admin-UI.md)**: User interface architecture
- **[Docker Integration](Docker-Integration.md)**: Container orchestration details
- **[Development Guide](Development-Guide.md)**: Contributing and building

---

> **Technical Implementation**: This architecture is implemented across 25+ TypeScript packages in a yarn workspace monorepo, with the main application entry point in `packages/dappmanager/` and the web interface in `packages/admin-ui/`.