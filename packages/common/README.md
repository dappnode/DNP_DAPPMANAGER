# Common

> Shared validation schemas, transport utilities, and common functionality

## Overview

The Common package provides shared functionality used across the DAppNode ecosystem, including JSON schema validation, API transport utilities, and common business logic. It serves as the foundation for data validation, API communication, and shared operations between the frontend and backend.

### Key Features

- **JSON Schema Validation**: Comprehensive validation schemas for all API operations
- **Transport Layer**: HTTP and WebSocket communication utilities  
- **Schema Generation**: Automatic schema generation from TypeScript types
- **Validation Engine**: Runtime validation of API inputs and outputs
- **Error Handling**: Standardized error handling and messaging
- **Type Safety**: Bridge between TypeScript types and runtime validation

## Package Structure

```
src/
├── validation/        # JSON schemas and validation logic
├── transport/         # Communication and transport utilities
└── index.ts          # Main exports and public API
```

## Core Functionality

### Schema Validation

The package provides comprehensive JSON schema validation for all DAppNode API operations:

```typescript
import { validateRoutesArguments, validateRoutesReturn } from '@dappnode/common';

// Validate API call parameters
const isValid = validateRoutesArguments('packageInstall', {
  name: "bitcoin.dnp.dappnode.eth",
  version: "latest"
});

// Validate API response data
const responseValid = validateRoutesReturn('packagesGet', packagesData);
```

### Transport Utilities

Communication helpers for API calls and data transport:

```typescript
import { transport } from '@dappnode/common';

// HTTP request utilities
const response = await transport.request(endpoint, data);

// WebSocket communication helpers
const subscription = transport.subscribe(channel, callback);
```

## Schema Generation

The package automatically generates JSON schemas from TypeScript definitions:

### Build Process
```bash
yarn build    # Generates schemas during compilation
```

The build process creates:
- `RoutesArguments.schema.json` - API parameter validation schemas
- `RoutesReturn.schema.json` - API response validation schemas  
- `SubscriptionsArguments.schema.json` - WebSocket subscription schemas

### Generated Schemas

Example generated schema for package installation:

```json
{
  "packageInstall": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "version": { "type": "string" },
      "userSettings": { "type": "object" },
      "options": { 
        "type": "object",
        "properties": {
          "BYPASS_RESOLVER": { "type": "boolean" }
        }
      }
    },
    "required": ["name"]
  }
}
```

## Validation Engine

### Runtime Validation

The package provides runtime validation that ensures type safety:

```typescript
import { validateCall } from '@dappnode/common';

// Validate complete API call (parameters and response)
const result = await validateCall('packageInstall', params, async (validatedParams) => {
  return await packageInstallHandler(validatedParams);
});
```

### Error Handling

Standardized validation errors with detailed information:

```typescript
interface ValidationError {
  code: string;
  message: string;
  path: string[];
  value: any;
  schema: object;
}
```

## Transport Layer

### HTTP Communication

HTTP utilities for API communication:

```typescript
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

const response = await transport.http(url, data, options);
```

### WebSocket Integration

WebSocket helpers for real-time communication:

```typescript
// Subscribe to real-time updates
const unsubscribe = transport.subscribe('chainData', (data) => {
  console.log('Chain data update:', data);
});

// Publish events
transport.publish('notification', notificationData);
```

## API Integration

### Frontend Integration

The Common package enables type-safe API calls in the frontend:

```typescript
// Admin UI integration
import { api } from '@dappnode/common';

const result = await api.call('packageInstall', {
  name: "bitcoin.dnp.dappnode.eth",
  version: "latest"
});
// Result is fully typed based on schema validation
```

### Backend Integration

Backend API handlers use common validation:

```typescript
// DAppManager integration
import { validateAndCall } from '@dappnode/common';

export const packageInstall = validateAndCall('packageInstall', async (params) => {
  // params are validated and typed
  return await installer.install(params);
});
```

## Schema Validation Categories

### API Routes
- **Package Operations**: Install, remove, configure packages
- **System Management**: Host operations, updates, monitoring
- **Docker Management**: Container and image operations
- **Blockchain Operations**: Staking, chain data, validation
- **Network Configuration**: VPN, port forwarding, DNS

### Subscriptions
- **Real-time Data**: Chain synchronization, system metrics
- **Notifications**: Alert system and user notifications
- **Package Events**: Installation progress, status updates
- **System Events**: Host status, network changes

### Data Types
- **Primitive Validation**: String, number, boolean validation
- **Complex Objects**: Nested object and array validation
- **Enums and Unions**: Type-safe enumeration validation
- **Optional Fields**: Proper handling of optional properties

## Dependencies

### Internal Dependencies
- `@dappnode/types` - TypeScript type definitions for schema generation

### External Dependencies
- `ajv` - JSON schema validation library
- Schema generation tools for build process
- Transport utilities for communication

## Development

### Prerequisites
- Understanding of JSON Schema specification
- Knowledge of TypeScript type system
- Familiarity with API validation patterns

### Development Scripts
```bash
yarn build          # Generate schemas and compile TypeScript
yarn dev            # Watch mode for development
yarn test           # Run validation tests
```

### Adding New Schemas

1. **Define Types**: Add TypeScript interfaces in `@dappnode/types`
2. **Update Routes**: Add route definitions to types package
3. **Generate Schema**: Build process will auto-generate schemas
4. **Validate**: Add validation tests for new schemas
5. **Document**: Update API documentation

## Testing

```bash
yarn test           # Run validation tests
```

### Test Coverage
- Schema validation accuracy
- Type safety verification
- Error handling scenarios
- Transport layer functionality

## Performance Considerations

- **Schema Caching**: Compiled schemas are cached for performance
- **Lazy Loading**: Schemas loaded on-demand when needed
- **Validation Optimization**: Efficient validation with early exit
- **Memory Management**: Optimal memory usage for large schemas

## Error Handling

### Validation Errors
```typescript
interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  data?: any;
}
```

### Error Categories
- **Schema Errors**: Invalid schema definitions
- **Validation Errors**: Data doesn't match schema
- **Transport Errors**: Communication failures
- **System Errors**: Runtime or configuration issues

## Integration Points

### DAppManager Backend
- Validates all API call parameters
- Ensures response data correctness
- Provides type-safe API handlers

### Admin UI Frontend
- Validates form inputs and user data
- Ensures API call correctness
- Provides type-safe API client

### External Tools
- CLI tools can use validation schemas
- Third-party integrations benefit from schemas
- Development tools leverage type information

## Contributing

When contributing to the Common package:

1. Understand the impact on both frontend and backend
2. Follow JSON Schema best practices
3. Add comprehensive validation tests
4. Consider performance implications
5. Update documentation for schema changes

## Contact

**Maintainers:**
- @pablomendezroyo - Lead Developer
- @dappnodedev - Core Team

**Issues:** Please report validation or schema issues in the main DNP_DAPPMANAGER repository
