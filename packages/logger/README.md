# Logger

> Centralized logging infrastructure for DAppNode ecosystem

## Overview

The Logger package provides a comprehensive logging system for the entire DAppNode ecosystem. It offers structured logging, multiple output targets, log rotation, and performance monitoring capabilities. The logger is designed to handle high-volume logging scenarios while maintaining performance and providing valuable debugging and monitoring information.

### Key Features

- **Structured Logging**: JSON-formatted logs with metadata and context
- **Multiple Log Levels**: Debug, info, warn, error with configurable filtering
- **Multi-Target Output**: Console, file, and remote logging destinations
- **Performance Monitoring**: Request/response logging and timing
- **Log Rotation**: Automatic log file management and archival
- **Context Preservation**: Maintain request context across async operations
- **Error Tracking**: Enhanced error logging with stack traces and context

## Log Levels

The logger supports standard log levels with appropriate use cases:

- **DEBUG**: Detailed diagnostic information, typically disabled in production
- **INFO**: General operational information about system behavior
- **WARN**: Warning messages for potential issues that don't stop execution
- **ERROR**: Error messages for exceptions and failures that require attention

## Core Functionality

### Basic Logging
```typescript
import { logs } from '@dappnode/logger';

// Basic log messages
logs.debug('Debug information', { context: 'additional data' });
logs.info('System startup completed');
logs.warn('Deprecated API usage detected', { api: '/old-endpoint' });
logs.error('Database connection failed', error);
```

### Structured Logging
```typescript
// Log with structured metadata
logs.info('Package installation started', {
  dnpName: 'bitcoin.dnp.dappnode.eth',
  version: '1.0.0',
  userId: 'user123',
  timestamp: new Date().toISOString()
});

// Error logging with context
logs.error('Package installation failed', {
  error: error.message,
  stack: error.stack,
  dnpName: 'bitcoin.dnp.dappnode.eth',
  step: 'download-images'
});
```

### Request/Response Logging
```typescript
import { routesLogger, subscriptionsLogger } from '@dappnode/logger';

// HTTP API request logging
routesLogger.info('API call received', {
  method: 'POST',
  endpoint: '/package/install',
  requestId: 'req-123',
  userAgent: 'DAppNode-UI/1.0.0'
});

// WebSocket subscription logging  
subscriptionsLogger.info('Subscription established', {
  channel: 'chainData',
  clientId: 'client-456',
  subscriptionCount: 5
});
```

## Logger Configuration

### Environment Variables
```bash
# Log level configuration
LOG_LEVEL=info          # debug, info, warn, error
LOG_FORMAT=json         # json, text
LOG_OUTPUT=console      # console, file, both

# File logging configuration
LOG_FILE_PATH=/var/log/dappnode/
LOG_MAX_SIZE=10MB       # Maximum log file size
LOG_MAX_FILES=5         # Number of rotated files to keep
```

### Programmatic Configuration
```typescript
import { configureLogger } from '@dappnode/logger';

configureLogger({
  level: 'info',
  format: 'json',
  outputs: ['console', 'file'],
  fileConfig: {
    path: '/var/log/dappnode/',
    maxSize: '10MB',
    maxFiles: 5,
    datePattern: 'YYYY-MM-DD'
  }
});
```

## Specialized Loggers

### Routes Logger
Specialized for HTTP API request/response logging:

```typescript
import { routesLogger } from '@dappnode/logger';

// Request logging
routesLogger.request({
  method: 'POST',
  url: '/api/package/install',
  requestId: 'req-123',
  body: { dnpName: 'bitcoin.dnp.dappnode.eth' }
});

// Response logging
routesLogger.response({
  requestId: 'req-123',
  statusCode: 200,
  duration: 1234,
  responseSize: 2048
});
```

### Subscriptions Logger
Specialized for WebSocket and real-time event logging:

```typescript
import { subscriptionsLogger } from '@dappnode/logger';

// Subscription events
subscriptionsLogger.subscribe({
  channel: 'chainData',
  clientId: 'client-456',
  filters: { network: 'mainnet' }
});

subscriptionsLogger.unsubscribe({
  channel: 'chainData', 
  clientId: 'client-456',
  reason: 'client-disconnect'
});
```

## Log Formats

### JSON Format (Production)
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Package installation completed",
  "context": {
    "dnpName": "bitcoin.dnp.dappnode.eth",
    "version": "1.0.0",
    "duration": 45000
  },
  "service": "dappmanager",
  "requestId": "req-123"
}
```

### Text Format (Development)
```text
2024-01-15 10:30:00 [INFO] Package installation completed - bitcoin.dnp.dappnode.eth@1.0.0 (45s)
```

## Performance Monitoring

### Request Timing
```typescript
import { logs } from '@dappnode/logger';

const startTime = Date.now();

try {
  await performOperation();
  logs.info('Operation completed', {
    operation: 'package-install',
    duration: Date.now() - startTime,
    success: true
  });
} catch (error) {
  logs.error('Operation failed', {
    operation: 'package-install', 
    duration: Date.now() - startTime,
    success: false,
    error: error.message
  });
}
```

### System Metrics
```typescript
// Log system performance metrics
logs.info('System metrics', {
  cpuUsage: process.cpuUsage(),
  memoryUsage: process.memoryUsage(),
  uptime: process.uptime(),
  activeHandles: process._getActiveHandles().length
});
```

## Log Rotation and Management

### Automatic Rotation
- **Size-based**: Rotate when log files exceed configured size
- **Time-based**: Daily, weekly, or monthly rotation schedules
- **Retention Policy**: Automatically delete old log files
- **Compression**: Compress rotated logs to save disk space

### Manual Management
```typescript
import { rotateLog, archiveLogs, cleanupOldLogs } from '@dappnode/logger';

// Manual log rotation
await rotateLog();

// Archive old logs  
await archiveLogs({ compressionLevel: 6 });

// Cleanup logs older than specified days
await cleanupOldLogs({ retentionDays: 30 });
```

## Error Handling and Context

### Error Context Preservation
```typescript
// Enhanced error logging with full context
try {
  await installPackage(dnpName, version);
} catch (error) {
  logs.error('Package installation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context: {
      dnpName,
      version,
      step: 'image-download',
      retryCount: 3
    },
    system: {
      freeMemory: os.freemem(),
      loadAverage: os.loadavg()
    }
  });
}
```

### Request Context Tracking
```typescript
// Maintain context across async operations
const requestContext = {
  requestId: generateId(),
  userId: 'user123',
  sessionId: 'session456'
};

logs.setContext(requestContext);

// All subsequent logs will include this context
logs.info('Processing request'); // Includes requestId, userId, sessionId
```

## Integration Points

### DAppManager Integration
```typescript
// API endpoint logging
app.use((req, res, next) => {
  const startTime = Date.now();
  
  routesLogger.request({
    method: req.method,
    url: req.url,
    requestId: req.id,
    userAgent: req.get('User-Agent')
  });
  
  res.on('finish', () => {
    routesLogger.response({
      requestId: req.id,
      statusCode: res.statusCode,
      duration: Date.now() - startTime
    });
  });
  
  next();
});
```

### Event Bus Integration
```typescript
// Log all event bus activity
eventBus.on('*', (eventType, data) => {
  logs.debug('Event emitted', {
    eventType,
    data,
    timestamp: Date.now()
  });
});
```

## Development

### Prerequisites
- Understanding of logging best practices
- Knowledge of structured logging concepts
- Familiarity with log analysis and monitoring

### Development Scripts
```bash
yarn build          # Compile TypeScript
yarn dev            # Watch mode for development  
yarn test           # Run logger tests
```

### Adding Custom Loggers

1. **Create Logger Instance**: Define specialized logger for component
2. **Configure Format**: Set appropriate log format and metadata
3. **Define Context**: Establish relevant context fields
4. **Export Interface**: Make logger available to consuming code
5. **Document Usage**: Add usage examples and guidelines

## Testing

```bash
yarn test           # Run logging tests
```

### Test Coverage
- Log level filtering and configuration
- Output format validation
- File rotation and cleanup
- Performance impact measurement
- Context preservation across async operations

## Monitoring and Observability

### Log Analysis
- **Centralized Logging**: Aggregate logs from all DAppNode components
- **Search and Filtering**: Query logs by level, service, context
- **Alerting**: Set up alerts for error patterns and thresholds
- **Dashboards**: Visualize log metrics and system health

### Performance Monitoring
- **Log Volume**: Monitor log generation rates
- **Performance Impact**: Measure logging overhead
- **Storage Usage**: Track log file sizes and growth
- **Error Rates**: Monitor error frequency and patterns

## Best Practices

### Logging Guidelines
1. **Appropriate Levels**: Use correct log levels for different message types
2. **Structured Data**: Include relevant context and metadata
3. **Performance**: Avoid expensive operations in log statements
4. **Security**: Never log sensitive information (passwords, keys, tokens)
5. **Consistency**: Use consistent field names and message formats

### Context Management
```typescript
// Good: Include relevant context
logs.info('Package installed successfully', {
  dnpName: 'bitcoin.dnp.dappnode.eth',
  version: '1.0.0',
  installTime: 45000
});

// Bad: Minimal context
logs.info('Package installed');
```

## Troubleshooting

Common logging issues and solutions:

- **High Log Volume**: Adjust log levels and implement sampling
- **File Permission Issues**: Check log directory permissions
- **Log Rotation Problems**: Verify disk space and rotation configuration
- **Performance Impact**: Profile logging overhead and optimize
- **Missing Context**: Ensure context is properly preserved across async calls

## Contributing

When contributing to the Logger package:

1. Follow structured logging principles
2. Maintain backward compatibility for log formats
3. Add comprehensive tests for new logging features
4. Consider performance impact of changes
5. Update documentation for new logging patterns

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report logging issues in the main DNP_DAPPMANAGER repository
