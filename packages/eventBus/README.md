# Event Bus

> Inter-service communication and event-driven architecture for DAppNode

## Overview

The Event Bus package provides a centralized event-driven communication system for DAppNode services. It enables loose coupling between components by facilitating publish-subscribe messaging patterns, real-time notifications, and asynchronous event handling across the entire system.

### Key Features

- **Publish-Subscribe Pattern**: Decoupled communication between services
- **Type-Safe Events**: TypeScript-based event definitions and handlers
- **Real-Time Communication**: Immediate event propagation across services
- **Event Persistence**: Critical events stored for replay and debugging
- **Error Handling**: Robust error management and event recovery
- **Performance Optimized**: Efficient event routing and minimal overhead

## Event Categories

### System Events
- **Package Lifecycle**: Installation, updates, removal events
- **Container Events**: Docker container state changes
- **System Status**: Host system and resource events
- **Network Events**: Connectivity and configuration changes

### User Interface Events
- **Notifications**: User alerts and system messages
- **Progress Updates**: Long-running operation status
- **State Changes**: UI state synchronization
- **User Actions**: User-initiated system changes

### Blockchain Events
- **Chain Synchronization**: Blockchain sync status updates
- **Validator Events**: Staking and validation status changes
- **Network Changes**: Blockchain network configuration updates

## Core Functionality

### Event Publishing
```typescript
import { eventBus } from '@dappnode/eventbus';

// Publish system notification
eventBus.notification.emit({
  id: 'package-installed',
  type: 'success',
  title: 'Package Installed',
  body: 'Bitcoin node successfully installed'
});

// Publish package event
eventBus.packageInstall.emit({
  dnpName: 'bitcoin.dnp.dappnode.eth',
  version: '1.0.0',
  status: 'completed'
});
```

### Event Subscription
```typescript
// Subscribe to notifications
const unsubscribe = eventBus.notification.on((notification) => {
  console.log('New notification:', notification);
  // Handle notification display or storage
});

// Subscribe to package events
eventBus.packageInstall.on((event) => {
  updateProgressBar(event.progress);
  if (event.status === 'completed') {
    refreshPackageList();
  }
});

// Cleanup subscription
unsubscribe();
```

### WebSocket Integration
```typescript
// Real-time events to frontend
eventBus.requestPackages.emit(); // Trigger package list update
eventBus.pushNotification.emit(notification); // Send to UI
eventBus.updateChainData.emit(chainData); // Update blockchain status
```

## Event Types

### Notification Events
```typescript
interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  body: string;
  timestamp: number;
  actions?: NotificationAction[];
}
```

### Package Events
```typescript
interface PackageEvent {
  dnpName: string;
  version: string;
  operation: 'install' | 'update' | 'remove' | 'restart';
  status: 'started' | 'progress' | 'completed' | 'error';
  progress?: number;
  error?: string;
}
```

### System Events
```typescript
interface SystemEvent {
  type: 'restart' | 'update' | 'config-change';
  component: string;
  data: any;
  timestamp: number;
}
```

### Chain Events
```typescript
interface ChainEvent {
  network: string;
  syncing: boolean;
  progress: number;
  peers: number;
  blockHeight: number;
}
```

## Event Bus Architecture

### Core Components
```
EventBus
├── EventEmitter - Core event emission and subscription
├── TypedEvents - Type-safe event definitions
├── EventStore - Event persistence and replay
└── ErrorHandler - Error management and recovery
```

### Event Flow
1. **Event Generation**: Services emit events with typed data
2. **Event Routing**: Event bus routes to all subscribers
3. **Event Processing**: Subscribers handle events asynchronously
4. **Event Persistence**: Critical events stored for replay
5. **Error Handling**: Failed events logged and retried if needed

## API Reference

### Event Emitters

#### Notification Events
- `notification.emit(data)` - Emit notification event
- `notification.on(handler)` - Subscribe to notifications
- `pushNotification.emit(data)` - Send notification to UI

#### Package Events
- `packageInstall.emit(data)` - Package installation events
- `packageUpdate.emit(data)` - Package update events  
- `packageRemove.emit(data)` - Package removal events
- `requestPackages.emit()` - Request package list refresh

#### System Events
- `systemRestart.emit()` - System restart notification
- `systemUpdate.emit(data)` - System update events
- `configChange.emit(data)` - Configuration change events

#### Chain Events
- `chainSync.emit(data)` - Blockchain synchronization events
- `validatorStatus.emit(data)` - Validator status updates
- `chainData.emit(data)` - General chain data updates

### Subscription Management
```typescript
// Create subscription
const subscription = eventBus.eventName.on(handler);

// Remove subscription
subscription.unsubscribe();

// One-time subscription
eventBus.eventName.once(handler);

// Remove all subscriptions for an event
eventBus.eventName.removeAllListeners();
```

## Real-Time Integration

### WebSocket Bridge
The event bus integrates with WebSocket connections to provide real-time updates to the frontend:

```typescript
// Automatic WebSocket emission
eventBus.notification.on((notification) => {
  websocket.emit('notification', notification);
});

// Bidirectional communication
websocket.on('requestPackages', () => {
  eventBus.requestPackages.emit();
});
```

### Frontend Integration
```typescript
// Admin UI receives real-time events
socket.on('notification', (notification) => {
  displayNotification(notification);
});

socket.on('packageUpdate', (update) => {
  updatePackageStatus(update);
});
```

## Event Persistence

### Critical Event Storage
Some events are persisted for:
- **Audit Trail**: Track system changes and operations
- **Replay Capability**: Reconstruct system state
- **Debugging**: Analyze event sequences for troubleshooting
- **Recovery**: Restore state after system restart

### Event Store
```typescript
interface StoredEvent {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  processed: boolean;
}
```

## Error Handling

### Event Error Management
```typescript
// Error handling in event handlers
eventBus.packageInstall.on((event) => {
  try {
    processPackageInstall(event);
  } catch (error) {
    eventBus.error.emit({
      source: 'packageInstall',
      error: error.message,
      event: event
    });
  }
});
```

### Error Recovery
- **Retry Logic**: Automatic retry for failed event processing
- **Dead Letter Queue**: Store failed events for manual review
- **Circuit Breaker**: Prevent cascade failures from bad events
- **Monitoring**: Track event processing success rates

## Performance Considerations

### Optimization Strategies
- **Event Batching**: Batch similar events to reduce overhead
- **Async Processing**: Non-blocking event handling
- **Memory Management**: Efficient subscription management
- **Rate Limiting**: Prevent event flooding

### Monitoring
- Event throughput and latency metrics
- Subscription count and memory usage
- Error rates and failed event tracking
- Performance impact on system resources

## Development

### Prerequisites
- Understanding of event-driven architecture
- Knowledge of publish-subscribe patterns
- Familiarity with TypeScript and async programming

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode for development
yarn test           # Run event bus tests
```

### Adding New Events

1. **Define Event Type**: Add TypeScript interface for event data
2. **Create Emitter**: Add event emitter to appropriate category
3. **Export Event**: Add to main EventBus interface
4. **Document**: Update this README with new event details
5. **Test**: Add comprehensive tests for new event handling

## Testing

```bash
yarn test           # Run event bus tests
```

### Test Coverage
- Event emission and subscription
- Type safety and validation
- Error handling and recovery
- Performance and memory management
- WebSocket integration

## Integration Points

### DAppManager Backend
- Emits system and package events
- Handles administrative operations
- Manages system state changes

### Admin UI Frontend  
- Receives real-time updates via WebSocket
- Displays notifications and status changes
- Triggers user-initiated events

### System Services
- Docker container events
- Host system monitoring
- Network configuration changes

## Troubleshooting

Common event bus issues and solutions:

- **Memory Leaks**: Remove unused subscriptions properly
- **Event Flooding**: Implement rate limiting and batching
- **Lost Events**: Check WebSocket connectivity and event persistence
- **Performance Issues**: Monitor subscription count and event frequency

## Contributing

When contributing to the Event Bus package:

1. Understand the event-driven architecture patterns
2. Follow TypeScript best practices for type safety
3. Add comprehensive tests for new event types
4. Consider performance impact of new events
5. Document event schemas and usage patterns

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report event system issues in the main DNP_DAPPMANAGER repository

- Responsibles:
  - @pablomendezroyo
