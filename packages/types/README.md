# Types

> Comprehensive TypeScript type definitions for the DAppNode ecosystem

## Overview

The Types package provides a centralized collection of TypeScript type definitions used throughout the DAppNode ecosystem. It ensures type safety, API consistency, and developer experience across all packages in the monorepo by defining interfaces, types, and schemas for data structures, API calls, and system components.

### Key Features

- **API Types**: Complete type definitions for all API endpoints and responses
- **Data Models**: Core data structures for packages, containers, and system state
- **Validation Schemas**: Runtime validation schemas for API inputs and outputs
- **Blockchain Types**: Ethereum staking and blockchain-specific type definitions
- **System Types**: Host system, Docker, and infrastructure type definitions
- **Utility Types**: Helper types and generic type utilities

## Package Structure

```
src/
├── manifest.ts          # Package manifest and metadata types
├── setupWizard.ts       # Package setup and configuration types
├── compose.ts           # Docker Compose file type definitions
├── stakers.ts           # Ethereum staking and validator types
├── pkg.ts               # Package and container type definitions
├── calls.ts             # API call parameter and response types
├── routes.ts            # API route definitions and interfaces
├── rollups.ts           # Layer 2 and rollup integration types
├── globalEnvs.ts        # Global environment configuration types
├── releaseFiles.ts      # Package release and file types
├── subscriptions.ts     # WebSocket subscription types
├── notifications.ts     # Notification system types
└── utils/               # Utility types and helpers
```

## Core Type Categories

### API Types
Complete type definitions for the DAppNode API:

```typescript
// Route definitions with typed parameters and responses
interface Routes {
  packageInstall(params: PackageInstallParams): Promise<PackageInstallResult>;
  packagesGet(): Promise<InstalledPackage[]>;
  chainDataGet(): Promise<ChainData[]>;
  // ... 100+ API endpoints
}
```

### Package Types
Types for DAppNode packages and containers:

```typescript
interface InstalledPackage {
  dnpName: string;
  version: string;
  isDnp: boolean;
  isCore: boolean;
  containers: Container[];
  userSettings: UserSettings;
}

interface Container {
  containerName: string;
  image: string;
  state: ContainerState;
  running: boolean;
  // ... additional container properties
}
```

### Blockchain Types
Ethereum staking and blockchain integration types:

```typescript
interface ChainData {
  dnpName: string;
  syncing: boolean;
  error?: boolean;
  progress?: number;
  peers?: number;
  network?: Network;
}

interface StakerConfig {
  network: Network;
  executionClient?: string;
  consensusClient?: string;
  mevBoost?: boolean;
}
```

### System Types
Host system and infrastructure types:

```typescript
interface SystemInfo {
  version: string;
  versionData: VersionData;
  ip: string;
  name: string;
  staticIp: string;
  domain: string;
  upnpAvailable: boolean;
  noNatLoopback: boolean;
  alertToOpenPorts: PortToOpen[];
  internalIp: string;
  // ... additional system properties
}
```

## Validation Integration

The types package integrates with runtime validation:

```typescript
// Types with corresponding JSON schemas
interface PackageInstallParams {
  name: string;
  version?: string;
  userSettings?: UserSettings;
  options?: InstallOptions;
}

// Validation schemas generated from types
const packageInstallParamsSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    version: { type: "string" },
    // ... schema properties
  }
};
```

## Exported Type Categories

### Manifest and Metadata
- `Manifest` - Package manifest structure
- `PackageMetadata` - Package information and versioning
- `Dependencies` - Package dependency definitions
- `Architecture` - Multi-architecture support types

### Setup and Configuration
- `SetupWizard` - Package setup wizard definitions
- `SetupUiJson` - Setup UI configuration
- `UserSettings` - User-configurable package settings
- `GlobalEnvs` - Global environment variables

### Docker and Compose
- `ComposeService` - Docker Compose service definitions
- `ComposeNetwork` - Network configuration types
- `ComposeVolume` - Volume mounting and management
- `DockerCompose` - Complete compose file structure

### Blockchain and Staking
- `Network` - Supported blockchain networks
- `StakerItem` - Staking component definitions
- `ChainData` - Blockchain synchronization data
- `ValidatorData` - Validator performance metrics

### API and Communication
- `Routes` - Complete API route definitions
- `Subscriptions` - WebSocket subscription types
- `NotificationData` - Notification system types
- `CallsArguments` - API call parameter types
- `CallsReturn` - API response types

### System and Infrastructure
- `PackageContainer` - Container lifecycle management
- `VolumeData` - Storage and volume information
- `NetworkData` - Network configuration and stats
- `SystemData` - Host system information

## Development Integration

### Build Process
The types package is built early in the monorepo build process to ensure all dependent packages have access to type definitions:

```bash
yarn build    # Compiles TypeScript definitions
yarn dev      # Watch mode for development
```

### Import Patterns
```typescript
// Import specific types
import { InstalledPackage, ChainData } from '@dappnode/types';

// Import type categories
import type { Routes, Subscriptions } from '@dappnode/types';

// Import utility types
import { UserSettings, PackageInstallParams } from '@dappnode/types';
```

## Version Management

The types package follows semantic versioning with careful consideration for breaking changes:

- **Major**: Breaking changes to existing type definitions
- **Minor**: New types and non-breaking additions
- **Patch**: Bug fixes and clarifications

Current version: `0.1.41` (published to NPM)

## NPM Publication

The types package is published to NPM for external consumption:

```bash
npm install @dappnode/types
```

This allows external tools and applications to use DAppNode type definitions for integration and development.

## Type Safety Features

### Strict TypeScript
- Strict null checks enabled
- No implicit any types
- Complete type coverage for all API surfaces

### Runtime Validation
- JSON schema generation from TypeScript types
- Automatic validation of API inputs and outputs
- Type-safe error handling

### Generic Utilities
- Conditional types for advanced type manipulation
- Mapped types for transformations
- Utility types for common patterns

## Dependencies

### Internal Dependencies
- Minimal internal dependencies to avoid circular references
- Self-contained type definitions

### External Dependencies
- No runtime dependencies (types only)
- Development dependencies for building and validation

## Development

### Prerequisites
- Understanding of TypeScript advanced features
- Knowledge of JSON Schema and validation
- Familiarity with DAppNode architecture

### Development Guidelines
1. **Type Completeness**: Ensure all API surfaces have complete types
2. **Breaking Changes**: Carefully consider impact of type changes
3. **Documentation**: Document complex types with JSDoc comments
4. **Validation**: Ensure types align with runtime validation schemas
5. **Consistency**: Maintain consistent naming and structure patterns

### Adding New Types

1. **Identify Category**: Determine appropriate file for new types
2. **Define Interface**: Create comprehensive type definition
3. **Export**: Add to appropriate export in `index.ts`
4. **Validation**: Add corresponding validation schemas if needed
5. **Documentation**: Update this README if adding new categories

## Testing

Types are validated through:
- **Compilation**: TypeScript compiler ensures type correctness
- **Usage**: All dependent packages validate type usage
- **Validation**: Runtime validation ensures type/schema alignment

## Contributing

When contributing to the Types package:

1. Understand the impact of type changes across the monorepo
2. Follow existing patterns for type organization
3. Add comprehensive JSDoc documentation for complex types
4. Consider backward compatibility for external consumers
5. Test type changes against all dependent packages

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report type-related issues in the main DNP_DAPPMANAGER repository
