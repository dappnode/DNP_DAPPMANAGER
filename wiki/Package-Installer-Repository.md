# 🔧 DAppNode Package Installer & Repository

The DAppNode Package Installer & Repository system is the heart of how DAppNode discovers, downloads, validates, and installs blockchain applications. This system provides a decentralized package management experience similar to traditional package managers but designed for blockchain infrastructure.

## 🏗️ Architecture Overview

The installer system consists of several key components working together:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │  DAppManager    │    │   Repository    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Blockchain)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   IPFS Client   │    │   Ethereum      │
                       │   (Content)     │    │   (Metadata)    │
                       └─────────────────┘    └─────────────────┘
```

## 🌍 Ethereum Integration

### Registry & Repository System
DAppNode uses **Aragon Package Manager (APM)** deployed on Ethereum mainnet to manage package metadata:

- **Registry Contract**: `0x0c564ca7b948008fb324268d8baedaeb1bd47bce`
- **ENS Domain**: `dappmanager.dnp.dappnode.eth`

### How It Works
1. **Package Discovery**: The system queries Ethereum contracts to find available packages
2. **Version Resolution**: Uses semantic versioning to resolve dependencies
3. **Content Addressing**: IPFS hashes stored on-chain point to actual package content
4. **Verification**: Cryptographic signatures ensure package integrity

### Contract Interaction
```typescript
// From packages/installer/src/dappnodeInstaller.ts
async function getVersionAndIpfsHash({
  dnpNameOrHash,
  contractAddress
}: {
  dnpNameOrHash: string;
  contractAddress: string;
}): Promise<{ version: string; contentUri: string }> {
  // Queries APM registry for latest version and IPFS hash
}
```

## 📦 IPFS Content Distribution

### Content-Addressed Storage
All package content is distributed via **IPFS (InterPlanetary File System)**:

- **Manifest files**: Package metadata, dependencies, configuration
- **Docker images**: Containerized applications  
- **Supporting files**: Documentation, setup wizards, configuration templates

### CAR (Content Addressed aRchives)
DAppNode uses **CAR files** for efficient IPFS content distribution:

```typescript
// From packages/toolkit/src/repository/
interface DistributedFile {
  hash: string;        // IPFS hash
  source: string;      // Gateway URL or direct IPFS link
  size?: number;       // File size in bytes
}
```

### Benefits of IPFS
- **Decentralization**: No single point of failure
- **Deduplication**: Identical content shares the same hash
- **Verification**: Content hash ensures integrity
- **Caching**: Popular packages cached across the network

## ⚙️ Package Installation Process

### 1. Package Resolution (`dappGet`)
The `dappGet` system handles complex dependency resolution:

```typescript
// From packages/installer/src/dappGet/
interface PackageRequest {
  name: string;
  version?: string;      // Semantic version or "latest"
  userSettings?: object; // User-provided configuration
}
```

**Resolution Algorithm:**
1. **Dependency Analysis**: Parse all dependencies recursively
2. **Version Compatibility**: Ensure all versions are compatible
3. **Conflict Resolution**: Handle version conflicts gracefully
4. **Installation Order**: Determine correct installation sequence

### 2. Content Download
```typescript
// From packages/installer/src/dappnodeInstaller.ts
class DappnodeInstaller extends DappnodeRepository {
  private async downloadPackageFiles(contentUri: string): Promise<PackageFiles> {
    // Downloads manifest, compose file, setup wizard, etc.
    // Validates schemas and file integrity
  }
}
```

### 3. Docker Integration
Each package consists of:
- **docker-compose.yml**: Container orchestration configuration
- **dappnode_package.json**: Package metadata and DAppNode-specific settings
- **setup.json**: Optional setup wizard configuration
- **notifications.yaml**: Monitoring and alerting configuration

### 4. Validation & Security
```typescript
// From packages/installer/src/dappnodeInstaller.ts
private validateSchemas(pkgRelease: PackageRelease): void {
  validateManifestSchema(manifest);
  validateDappnodeCompose(compose);
  validateSetupWizardSchema(setupWizard);
  validateNotificationsSchema(notifications);
}
```

## 🔍 Package Discovery & Browsing

### Directory Integration
DAppNode integrates with the **DAppNode Directory** smart contract for package discovery:

- **Featured Packages**: Curated list of recommended packages
- **Category Filtering**: Browse by blockchain, application type, etc.
- **Search Functionality**: Find packages by name, description, or keywords
- **User Ratings**: Community feedback and ratings

### Metadata Enhancement
The installer enriches basic package metadata with:

```typescript
// From packages/installer/src/dappnodeInstaller.ts
private joinFilesInManifest({
  manifest,
  SetupWizard,        // Interactive configuration
  disclaimer,         // Legal/usage disclaimers
  gettingStarted,     // User documentation
  prometheusTargets,  // Monitoring endpoints
  grafanaDashboards,  // Visualization dashboards
  notifications,      // Alert configuration
  avatarFile         // Package icon/logo
}): Manifest
```

## 🛠️ Installation Types

### Core Packages
**System-critical packages** that provide DAppNode infrastructure:
- Cannot be uninstalled by users
- Auto-update with system updates
- Examples: `bind.dnp.dappnode.eth`, `wifi.dnp.dappnode.eth`

### User Packages  
**Optional packages** installed by users:
- Full user control over installation/removal
- Independent update cycles
- Examples: blockchain clients, monitoring tools, applications

### Dependency Management
```typescript
// From packages/installer/src/dappGet/utils/sanitizeDependencies.ts
function sanitizeDependencies(dependencies: Dependencies): Dependencies {
  // Ensures dependency versions are compatible
  // Resolves conflicts and suggests alternatives
}
```

## 📊 Installation Monitoring

### Real-time Progress
The installer provides detailed progress feedback:

```typescript
// Installation progress events
eventBus.emit('installer.progress', {
  packageName: string;
  stage: 'downloading' | 'validating' | 'configuring' | 'starting';
  progress: number;     // 0-100
  message: string;      // Human-readable status
});
```

### Error Handling
Comprehensive error recovery:
- **Rollback Support**: Automatic cleanup on failed installations
- **Retry Logic**: Automatic retries for network-related failures  
- **User Guidance**: Clear error messages with suggested solutions

## 🔧 Advanced Features

### Custom Package Sources
Support for alternative package sources:
- **Local Development**: Install packages from local filesystem
- **IPFS Gateways**: Alternative IPFS gateway configuration
- **Private Registries**: Enterprise package distribution

### Package Templates
```typescript
// From packages/installer/src/dappnodeInstaller.ts
interface PackageRelease {
  manifest: Manifest;           // Core package metadata
  compose: Compose;            // Docker orchestration
  setupWizard?: SetupWizard;   // Interactive configuration
  disclaimer?: string;         // Legal notices
  gettingStarted?: string;     // Documentation
  avatarFile?: DistributedFile; // Package branding
}
```

## 🚀 Performance Optimizations

### Caching Strategy
- **Metadata Caching**: Package information cached locally
- **Content Caching**: IPFS content cached across installations
- **Dependency Caching**: Resolved dependency trees cached

### Parallel Processing
- **Concurrent Downloads**: Multiple package files downloaded simultaneously
- **Background Validation**: Schema validation performed during download
- **Async Installation**: Non-blocking installation process

## 🔗 Related Systems

- **[Updates](Updates.md)**: How packages are updated and maintained
- **[Docker Integration](Docker-Integration.md)**: Container orchestration details
- **[Networking](Networking.md)**: Package network configuration
- **[Admin UI](Admin-UI.md)**: User interface for package management

---

> **Technical Implementation**: The installer is implemented in `packages/installer/` with the main class `DappnodeInstaller` extending `DappnodeRepository` from the toolkit package.