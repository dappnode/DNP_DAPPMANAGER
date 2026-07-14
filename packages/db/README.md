# Database (DB)

> Persistent data storage and state management for DAppNode

## Overview

The Database package provides a comprehensive data persistence layer for DAppNode, managing system configuration, user settings, package state, and operational data. It uses a JSON-based file storage system with structured data access patterns and atomic operations.

### Key Features

- **JSON File Storage**: Lightweight, human-readable data persistence
- **Atomic Operations**: Safe concurrent access with file locking
- **Structured Data**: Organized data schemas for different system components
- **Configuration Management**: System settings, user preferences, and package configurations
- **State Persistence**: Maintain system state across restarts
- **Cache Management**: Separate cache database for temporary data

## Database Structure

The package manages multiple database files:

- **Main Database**: Persistent system and user data
- **Cache Database**: Temporary data and caching layer
- **Configuration Data**: System parameters and settings
- **Package State**: Installed packages and their configurations
- **User Preferences**: User-specific settings and customizations

## Core Functionality

### Configuration Management
```typescript
import * as db from '@dappnode/db';

// Auto-update settings
const autoUpdateSettings = db.autoUpdateSettings.get();
await db.autoUpdateSettings.set({
  systemPackages: true,
  dnpPackages: false
});

// Network configuration
const networkConfig = db.network.get();
await db.network.set({
  staticIp: '192.168.1.100',
  domain: 'my.dappnode.local'
});
```

### Package Management
```typescript
// Package state
const packageData = db.package.get('bitcoin.dnp.dappnode.eth');
await db.package.set('bitcoin.dnp.dappnode.eth', {
  version: '1.0.0',
  userSettings: { /* ... */ }
});

// Release keys for package verification
const releaseKeys = db.releaseKeys.get();
await db.releaseKeys.set(newReleaseKeys);
```

### System State
```typescript
// System information
const systemInfo = db.system.get();
await db.system.set({
  version: '0.2.0',
  buildDate: new Date().toISOString()
});

// Core update tracking
const coreUpdate = db.coreUpdate.get();
await db.coreUpdate.set({
  available: true,
  version: '0.2.1'
});
```

### User Interface State
```typescript
// UI preferences
const uiConfig = db.ui.get();
await db.ui.set({
  theme: 'dark',
  language: 'en',
  hideGettingStarted: true
});

// Notification management
const notifications = db.notification.getAll();
await db.notification.push('notif-id', notificationData);
```

## Data Models

### Auto Update Settings
```typescript
interface AutoUpdateSettings {
  systemPackages: boolean;
  dnpPackages: boolean;
  interval: number;
  enabled: boolean;
}
```

### Network Configuration
```typescript
interface NetworkConfig {
  staticIp?: string;
  domain: string;
  upnpEnabled: boolean;
  dyndnsEnabled: boolean;
}
```

### Package Data
```typescript
interface PackageData {
  version: string;
  userSettings: UserSettings;
  environment: Record<string, string>;
  portMappings: PortMapping[];
}
```

### System Information
```typescript
interface SystemInfo {
  version: string;
  buildDate: string;
  architecture: string;
  ip: string;
  hostname: string;
}
```

## API Reference

### Configuration APIs
- `autoUpdateSettings` - Auto-update configuration
- `ethicalMetrics` - Privacy-focused metrics settings
- `ipfsClient` - IPFS client configuration
- `network` - Network and connectivity settings
- `system` - System information and status
- `ui` - User interface preferences

### Package Management APIs
- `package` - Individual package state and configuration
- `releaseKeys` - Package verification keys
- `coreUpdate` - System update information
- `fileTransferPath` - File transfer configurations

### Blockchain APIs
- `stakerConfig` - Ethereum staking configuration
- `optimismConfig` - Optimism Layer 2 settings
- `consensusClient*` - Consensus client configurations (per network)

### Network and Connectivity APIs
- `dyndns` - Dynamic DNS configuration
- `upnp` - UPnP port forwarding settings
- `vpn` - VPN configuration and credentials

### User Interface APIs
- `ui` - Interface preferences and settings
- `notification` - Notification management
- `counterViews` - Usage analytics and metrics

### System Flags and Control
- `systemFlags` - System-wide feature flags
- Various boolean flags for system control

## Database Operations

### Basic Operations
```typescript
// Get data
const data = db.someConfig.get();

// Set data (atomic write)
await db.someConfig.set(newData);

// Check if data exists
const exists = db.someConfig.exists();

// Remove data
await db.someConfig.remove();
```

### Notification Operations
```typescript
// Add notification
await db.notification.push(id, notificationData);

// Get all notifications
const all = db.notification.getAll();

// Remove notification
await db.notification.remove(id);

// Clear all notifications
await db.notification.clear();
```

### Advanced Operations
```typescript
// Atomic updates with validation
await db.atomicUpdate('package', packageName, (current) => {
  return { ...current, version: newVersion };
});

// Batch operations
await db.batch([
  { type: 'set', key: 'config1', value: data1 },
  { type: 'set', key: 'config2', value: data2 }
]);
```

## File System Structure

```
/data/
├── dappmanager.db          # Main database file
├── dappmanager-cache.db    # Cache database
├── backups/                # Database backups
└── temp/                   # Temporary files
```

### Database Files
- **JSON Format**: Human-readable and debuggable
- **Atomic Writes**: Prevent corruption during updates
- **Backup System**: Automatic backups before major changes
- **Migration Support**: Handle schema changes across versions

## Concurrency and Safety

### File Locking
- Atomic file operations prevent data corruption
- Concurrent read access with exclusive write access
- Retry mechanisms for locked files
- Graceful handling of filesystem errors

### Data Validation
- Schema validation for all data operations
- Type safety through TypeScript interfaces
- Runtime validation of critical data
- Error recovery and data repair mechanisms

## Performance Optimizations

### Caching Strategy
- Separate cache database for temporary data
- In-memory caching for frequently accessed data
- Lazy loading of large data structures
- Efficient JSON parsing and serialization

### Storage Efficiency
- Compressed JSON storage for large data
- Cleanup routines for obsolete data
- Efficient indexing for search operations
- Memory-mapped files for large datasets

## Migration and Versioning

### Database Migrations
```typescript
// Migration system handles schema changes
const migrations = [
  {
    version: '0.2.0',
    migrate: (db) => {
      // Transform data structure
      return transformedDb;
    }
  }
];
```

### Backup and Recovery
- Automatic backups before migrations
- Point-in-time recovery capabilities
- Export/import functionality for data portability
- Validation and repair tools for corrupted data

## Development

### Prerequisites
- Understanding of JSON data structures
- Knowledge of file system operations
- Familiarity with atomic operations and concurrency

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode for development
yarn test           # Run database tests
```

### Adding New Data Models

1. **Define Interface**: Add TypeScript interface for data structure
2. **Create Accessor**: Add database accessor in appropriate module
3. **Add Validation**: Include schema validation for data integrity
4. **Export API**: Add to main exports in `index.ts`
5. **Test**: Add comprehensive tests for new data model

## Testing

```bash
yarn test           # Run database tests
```

### Test Coverage
- Data persistence and retrieval
- Atomic operations and concurrency
- Migration and versioning
- Error handling and recovery
- Performance under load

## Security Considerations

- **File Permissions**: Proper filesystem permissions for data files
- **Data Validation**: Prevent injection and malformed data
- **Backup Security**: Secure backup storage and access
- **Audit Logging**: Track critical data changes

## Troubleshooting

Common database issues and solutions:

- **Corrupted Data**: Use backup and recovery tools
- **File Lock Issues**: Check for zombie processes and cleanup
- **Performance Issues**: Review caching strategy and data size
- **Migration Failures**: Use rollback and manual recovery
- **Disk Space**: Monitor storage usage and cleanup old data

## Contributing

When contributing to the Database package:

1. Understand the atomic operation requirements
2. Follow existing patterns for data accessors
3. Add proper validation for new data types
4. Include migration paths for schema changes
5. Test thoroughly with concurrent access scenarios

## Contact

**Maintainers:**
- @dappnodedev - Core Team
- @pablomendezroyo - Lead Developer

**Issues:** Please report database issues in the main DNP_DAPPMANAGER repository
