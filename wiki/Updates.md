# 🔄 Updates

The DAppNode update system ensures packages and core components stay current with the latest features, security patches, and compatibility improvements. The system supports different update strategies for different types of components.

## 🏗️ Update Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Update Daemon     │    │   Version Checker   │    │   Update Executor   │
│   (Scheduler)       │◄──►│   (Detection)       │◄──►│   (Installation)    │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  Notification       │    │   Registry Query    │    │   Docker Compose    │
│  System             │    │   (Ethereum)        │    │   Orchestration     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 📦 Package Updates

### Automated Version Checking
The update system continuously monitors for new package versions:

```typescript
// From packages/daemons/src/autoUpdates/updateMyPackages.ts
export async function checkNewPackagesVersion(dappnodeInstaller: DappnodeInstaller): Promise<void> {
  const packages = await listPackages();
  
  for (const pkg of packages) {
    if (pkg.dnpName.includes('dncore')) continue; // Skip core packages
    
    // Query registry for latest version
    const { version: newVersion, contentUri } = await dappnodeInstaller.getVersionAndIpfsHash({
      dnpNameOrHash: pkg.dnpName,
      contractAddress: contractAddressMap.get(pkg.dnpName)
    });
    
    // Compare versions using semantic versioning
    if (lte(newVersion, pkg.version)) continue;
    
    // Process update...
  }
}
```

### Update Types
The system categorizes updates by **semantic versioning**:

#### 🔴 Major Updates (Breaking Changes)
- **Version**: `1.0.0` → `2.0.0`  
- **Behavior**: Manual approval required
- **Risk**: May require configuration changes
- **Examples**: API changes, removed features, architectural changes

#### 🟡 Minor Updates (New Features)
- **Version**: `1.0.0` → `1.1.0`
- **Behavior**: Optional auto-update (user configurable)
- **Risk**: Low, backward compatible
- **Examples**: New features, performance improvements

#### 🟢 Patch Updates (Bug Fixes)
- **Version**: `1.0.0` → `1.0.1`
- **Behavior**: Auto-update by default
- **Risk**: Very low, bug fixes only
- **Examples**: Security patches, bug fixes, minor improvements

```typescript
// From packages/utils/src/computeSemverUpdateType.ts
function computeSemverUpdateType(from: string, to: string): UpdateType {
  const fromParts = from.split('.').map(Number);
  const toParts = to.split('.').map(Number);
  
  if (toParts[0] > fromParts[0]) return 'major';
  if (toParts[1] > fromParts[1]) return 'minor';
  if (toParts[2] > fromParts[2]) return 'patch';
  
  return 'patch';
}
```

### Update Delay Mechanism
Includes a configurable delay before applying updates:

```typescript
// From packages/daemons/src/autoUpdates/isUpdateDelayCompleted.ts
export function isUpdateDelayCompleted(
  updateType: UpdateType,
  updateTime: number
): boolean {
  const now = Date.now();
  const delays = {
    major: 7 * 24 * 60 * 60 * 1000,  // 7 days
    minor: 3 * 24 * 60 * 60 * 1000,  // 3 days  
    patch: 1 * 24 * 60 * 60 * 1000   // 1 day
  };
  
  return now - updateTime >= delays[updateType];
}
```

## 🏛️ Core Updates

### Core Package Management
Core packages are essential DAppNode infrastructure components:

- **bind.dnp.dappnode.eth**: DNS resolution and routing
- **wifi.dnp.dappnode.eth**: WiFi access point management
- **https.dnp.dappnode.eth**: HTTPS certificate management
- **dappmanager.dnp.dappnode.eth**: Package manager itself

### Core Update Strategy
```typescript
// Core packages have special update handling
const CORE_PACKAGES = [
  params.bindDnpName,
  params.wifiDnpName, 
  params.httpsDnpName,
  params.dappmanagerDnpName
];

// Core updates require careful orchestration
async function updateCorePackage(dnpName: string, version: string): Promise<void> {
  // 1. Download and validate new version
  // 2. Create backup of current configuration
  // 3. Update with rollback capability
  // 4. Verify system stability
}
```

### System-Wide Updates
Core updates may trigger **system-wide updates** that affect:
- Docker network configuration
- DNS resolution settings
- Certificate management
- Package dependencies

## ⚙️ Auto Update Configuration

### User Controls
Users can configure auto-update behavior through the Admin UI:

```typescript
// From packages/admin-ui/src/params.ts
export const autoUpdateIds = {
  MY_PACKAGES: "my-packages",      // User-installed packages
  SYSTEM_PACKAGES: "system-packages" // Core system packages
};
```

### Package-Level Settings
Each package can define its own update preferences:

```typescript
// From dappnode_package.json
{
  "name": "example.dnp.dappnode.eth",
  "version": "1.0.0",
  "autoupdate": {
    "enabled": true,
    "include": ["patch", "minor"], // Auto-update these types
    "delay": "3d"                  // Wait 3 days before updating
  }
}
```

### Global Settings Override
System administrators can override individual package settings:

```yaml
# Auto-update policy configuration
global_policy:
  auto_update_enabled: true
  allowed_types: ["patch"]        # Only auto-update patches
  delay_hours: 72                 # Wait 72 hours
  maintenance_window:             # Update only during maintenance
    start: "02:00"
    end: "04:00"
    timezone: "UTC"
```

## 🔔 Update Notifications

### Notification Types
The system sends different notifications for different update scenarios:

```typescript
// From packages/daemons/src/autoUpdates/sendUpdateNotification.ts
export async function sendUpdateNotificationMaybe(
  pkg: InstalledPackageData,
  updateType: UpdateType,
  availableVersion: string
): Promise<void> {
  const notification = {
    title: `Update available: ${pkg.dnpName}`,
    body: `Version ${availableVersion} is available (${updateType} update)`,
    type: updateType,
    actions: updateType === 'major' ? ['Review', 'Install'] : ['Install', 'Dismiss']
  };
  
  await eventBus.emit('notification.send', notification);
}
```

### Notification Channels
- **Web UI**: In-app notifications with actionable buttons
- **WebPush**: Browser push notifications (if enabled)
- **Email**: Email notifications (if configured)
- **Discord/Telegram**: Integration with messaging platforms

## 🛡️ Update Safety & Rollback

### Pre-Update Validation
Before applying updates, the system performs safety checks:

```typescript
// From packages/installer/src/dappnodeInstaller.ts
private async validateUpdate(
  currentPackage: InstalledPackageData,
  newPackage: PackageRelease
): Promise<ValidationResult> {
  // 1. Schema validation
  this.validateSchemas(newPackage);
  
  // 2. Dependency compatibility check
  await this.validateDependencies(newPackage.manifest.dependencies);
  
  // 3. Resource requirements check
  await this.validateResourceRequirements(newPackage.compose);
  
  // 4. Configuration migration validation
  await this.validateConfigMigration(currentPackage, newPackage);
}
```

### Rollback Capabilities
- **Configuration Backup**: Automatic backup of package configuration
- **Image Preservation**: Previous Docker images retained for rollback
- **Dependency Tracking**: Rollback impact analysis on dependent packages
- **Quick Recovery**: One-click rollback through Admin UI

### Update Failure Handling
```typescript
// From packages/daemons/src/autoUpdates/flagErrorUpdate.ts
export async function flagErrorUpdate(
  dnpName: string,
  version: string,
  error: Error
): Promise<void> {
  // 1. Log detailed error information
  // 2. Send error notification to user
  // 3. Disable auto-updates for this package temporarily
  // 4. Create support bundle for debugging
}
```

## 📊 Update Monitoring & Analytics

### Update Metrics
The system tracks comprehensive update metrics:

```typescript
interface UpdateMetrics {
  packageName: string;
  updateType: UpdateType;
  updateDuration: number;        // Time taken to update
  downloadSize: number;          // Size of update
  success: boolean;              // Update success/failure
  rollbackRequired: boolean;     // Whether rollback was needed
  userInteraction: boolean;      // Whether user approval was required
}
```

### Health Monitoring
- **Post-Update Health Checks**: Automatic verification that packages are running correctly
- **Performance Impact**: Monitor system performance before/after updates
- **User Satisfaction**: Track user-reported issues with updates

## 🔧 Update Scheduling

### Maintenance Windows
Updates can be scheduled during low-usage periods:

```typescript
// From packages/daemons/src/autoUpdates/updateScheduler.ts
interface MaintenanceWindow {
  start: string;    // "02:00"
  end: string;      // "04:00"
  timezone: string; // "UTC"
  days: string[];   // ["sunday", "wednesday"]
}

function isMaintenanceWindow(window: MaintenanceWindow): boolean {
  // Check if current time falls within maintenance window
}
```

### Priority-Based Updates
- **Critical Security Updates**: Immediate installation regardless of schedule
- **Regular Updates**: Respect maintenance windows and user preferences
- **Optional Updates**: User-initiated only

## 🌐 Network-Aware Updates

### Bandwidth Management
- **Progressive Download**: Large updates downloaded in chunks
- **Peer-to-Peer Distribution**: IPFS enables efficient content distribution
- **Bandwidth Limiting**: Configurable limits to prevent network saturation

### Offline Capabilities
- **Update Queuing**: Queue updates when offline, apply when online
- **Local Caching**: Cache update packages for offline installation
- **Delta Updates**: Only download changed portions when possible

## 🔗 Related Systems

- **[Package Installer & Repository](Package-Installer-Repository.md)**: Package installation and management
- **[Notifications](Notifications.md)**: Update notification system
- **[Docker Integration](Docker-Integration.md)**: Container update orchestration
- **[Admin UI](Admin-UI.md)**: User interface for update management

---

> **Technical Implementation**: The update system is implemented in `packages/daemons/src/autoUpdates/` with the main daemon running continuously to check for and apply updates.