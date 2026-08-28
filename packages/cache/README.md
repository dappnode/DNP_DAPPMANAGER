# @dappnode/cache

A robust caching package for DappNode applications using LRU (Least Recently Used) cache with TTL (Time To Live) support.

## Features

- **LRU Cache**: Automatically evicts least recently used items when cache reaches maximum capacity
- **TTL Support**: Items expire after a configurable time period
- **Pre-configured Instances**: Ready-to-use cache instances for common DappNode use cases
- **TypeScript Support**: Full TypeScript type safety

## Installation

This package is part of the DappNode monorepo workspace and is automatically available to other packages.

## Usage

### Pre-configured Cache Instances

The package provides three pre-configured cache instances optimized for different use cases:

```typescript
import { dappstoreCache, contractAddressCache, stakerConfigCache, getOrSet } from "@dappnode/cache";

// Cache dappstore package release data (30 min TTL, 500 items max)
const release = await getOrSet(
  dappstoreCache,
  `release:${packageName}`,
  async () => await dappnodeInstaller.getRelease(packageName)
);

// Cache smart contract addresses (24 hour TTL, 200 items max)
contractAddressCache.set(dnpName, contractAddress);
const address = contractAddressCache.get(dnpName);

// Cache staker configuration (10 min TTL, 50 items max)
const config = await getOrSet(
  stakerConfigCache,
  `stakerConfig:${network}`,
  async () => await fetchStakerConfig(network)
);
```

### Cache Configuration

Each pre-configured cache has specific settings optimized for its use case:

- **dappstoreCache**: For package metadata and release information
  - TTL: 30 minutes (dappstore data changes infrequently)
  - Max items: 500 (accommodate many packages)

- **contractAddressCache**: For smart contract addresses  
  - TTL: 24 hours (contract addresses rarely change)
  - Max items: 200 (limited number of contracts)

- **stakerConfigCache**: For staker configuration data
  - TTL: 10 minutes (more frequent updates expected)
  - Max items: 50 (limited number of networks)

### Cache Invalidation

Manually invalidate cache entries when data changes:

```typescript
// Invalidate specific cache entry
stakerConfigCache.delete(`stakerConfig:${network}`);

// Clear entire cache
dappstoreCache.clear();
```

### Custom Cache Instance

Create a custom cache instance using the `DappnodeCache` class:

```typescript
import { DappnodeCache } from "@dappnode/cache";

const customCache = new DappnodeCache({
  max: 100,           // Maximum 100 items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
  updateAgeOnGet: true, // Update item age when accessed
});
```

## Integration Points

This caching solution is integrated into the following DappNode components:

1. **fetchDirectory** (`dappmanager`): Caches dappstore package release data to reduce Ethereum RPC and IPFS gateway calls
2. **updateMyPackages** (`daemons`): Caches smart contract addresses for auto-update functionality  
3. **stakerConfigGet** (`dappmanager`): Caches staker configuration to reduce repeated database queries

## Performance Benefits

- **Reduced Network Calls**: Avoids repeated Ethereum RPC and IPFS gateway requests
- **Lower Latency**: Cached responses are returned immediately without network round-trips
- **Improved Reliability**: Reduces dependency on external services for frequently accessed data
- **Resource Efficiency**: Prevents redundant processing and API calls

## Implementation Details

- Built on top of `lru-cache` v11.x for robust LRU eviction policies
- Automatic TTL-based expiration ensures data freshness
- Thread-safe operations suitable for concurrent access
- Memory-efficient with configurable size limits
- TypeScript-first design with full type safety

## Testing

The package includes comprehensive tests covering:
- Basic cache operations (get, set, delete, clear)
- LRU eviction behavior
- TTL expiration
- getOrSet pattern functionality
- Integration scenarios

Run tests:
```bash
yarn test
```