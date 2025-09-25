# 🐳 Docker Integration

DAppNode's Docker integration provides comprehensive container orchestration, management, and monitoring capabilities that enable seamless deployment and operation of blockchain applications in isolated, secure environments.

## 🏗️ Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DAppNode Docker Stack                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Docker API  │  │Docker Compose│  │   Container      │  │
│  │ Integration  │◄─┤  Management  │◄─┤   Lifecycle     │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Volume     │  │   Network    │  │     Image        │  │
│  │ Management   │  │ Management   │  │   Management     │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Docker Engine                           │
│                  (Container Runtime)                       │
└─────────────────────────────────────────────────────────────┘
```

## 🔌 Docker API Integration

### Docker Client Configuration
```typescript
// From packages/dockerApi/src/dockerApi.ts
import Docker from 'dockerode';

interface DockerClientConfig {
  socketPath?: string;          // Unix socket path (default: /var/run/docker.sock)
  host?: string;                // TCP host
  port?: number;                // TCP port
  protocol?: 'http' | 'https';  // Protocol
  timeout?: number;             // Request timeout
}

class DockerApiClient {
  private docker: Docker;
  
  constructor(config: DockerClientConfig = {}) {
    this.docker = new Docker({
      socketPath: config.socketPath || '/var/run/docker.sock',
      timeout: config.timeout || 30000
    });
  }
  
  // Container management
  async listContainers(options?: Docker.ListContainersOptions): Promise<Docker.ContainerInfo[]> {
    return await this.docker.listContainers(options);
  }
  
  async getContainer(id: string): Promise<Docker.Container> {
    return this.docker.getContainer(id);
  }
  
  // Image management
  async listImages(): Promise<Docker.ImageInfo[]> {
    return await this.docker.listImages();
  }
  
  async pullImage(name: string, onProgress?: (progress: any) => void): Promise<void> {
    const stream = await this.docker.pull(name);
    
    if (onProgress) {
      stream.on('data', (chunk) => {
        const progress = JSON.parse(chunk.toString());
        onProgress(progress);
      });
    }
    
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });
  }
}
```

### Container Lifecycle Management
```typescript
// From packages/dockerApi/src/containerActions.ts
export interface ContainerLifecycleManager {
  start(containerId: string): Promise<void>;
  stop(containerId: string, timeout?: number): Promise<void>;
  restart(containerId: string): Promise<void>;
  remove(containerId: string, force?: boolean): Promise<void>;
  logs(containerId: string, options?: LogOptions): Promise<string>;
  exec(containerId: string, command: string[]): Promise<ExecResult>;
}

export class ContainerManager implements ContainerLifecycleManager {
  constructor(private docker: Docker) {}
  
  async start(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.start();
    
    // Wait for container to be running
    await this.waitForStatus(containerId, 'running', 30000);
  }
  
  async stop(containerId: string, timeout: number = 10): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.stop({ t: timeout });
    
    // Wait for container to be stopped
    await this.waitForStatus(containerId, 'exited', 30000);
  }
  
  async restart(containerId: string): Promise<void> {
    await this.stop(containerId);
    await this.start(containerId);
  }
  
  async logs(containerId: string, options: LogOptions = {}): Promise<string> {
    const container = this.docker.getContainer(containerId);
    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      timestamps: options.timestamps || false,
      tail: options.tail || 100,
      since: options.since
    });
    
    return logStream.toString();
  }
  
  private async waitForStatus(
    containerId: string, 
    expectedStatus: string, 
    timeout: number
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();
      
      if (info.State.Status === expectedStatus) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Container ${containerId} did not reach ${expectedStatus} status within ${timeout}ms`);
  }
}
```

## 📝 Docker Compose Integration

### Compose File Management
```typescript
// From packages/dockerCompose/src/compose.ts
interface ComposeService {
  image: string;
  container_name?: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  networks?: Record<string, any>;
  depends_on?: string[];
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  healthcheck?: {
    test: string | string[];
    interval?: string;
    timeout?: string;
    retries?: number;
    start_period?: string;
  };
  labels?: Record<string, string>;
}

interface ComposeFile {
  version: string;
  services: Record<string, ComposeService>;
  networks?: Record<string, any>;
  volumes?: Record<string, any>;
}

export class ComposeManager {
  async readComposeFile(path: string): Promise<ComposeFile> {
    const content = await fs.readFile(path, 'utf-8');
    return yaml.parse(content) as ComposeFile;
  }
  
  async writeComposeFile(path: string, compose: ComposeFile): Promise<void> {
    const content = yaml.stringify(compose, { indent: 2 });
    await fs.writeFile(path, content, 'utf-8');
  }
  
  async validateCompose(compose: ComposeFile): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Validate version
    if (!compose.version) {
      errors.push('Docker Compose version is required');
    }
    
    // Validate services
    if (!compose.services || Object.keys(compose.services).length === 0) {
      errors.push('At least one service is required');
    }
    
    // Validate each service
    for (const [serviceName, service] of Object.entries(compose.services)) {
      if (!service.image) {
        errors.push(`Service ${serviceName} must have an image`);
      }
      
      // Validate port mappings
      if (service.ports) {
        for (const port of service.ports) {
          if (!this.isValidPortMapping(port)) {
            errors.push(`Invalid port mapping: ${port} in service ${serviceName}`);
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  private isValidPortMapping(port: string): boolean {
    // Port mapping formats: "80", "8080:80", "127.0.0.1:8080:80"
    const portPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:)?(\d+:)?\d+$/;
    return portPattern.test(port);
  }
}
```

### Compose Operations
```typescript
// From packages/dockerApi/src/dockerComposeUp.ts
interface DockerComposeUpOptions {
  noRecreate?: boolean;         // Don't recreate existing containers
  forceRecreate?: boolean;      // Recreate containers even if unchanged
  build?: boolean;              // Build images before starting
  detach?: boolean;             // Run in background (default: true)
  removeOrphans?: boolean;      // Remove containers for services not in compose
  timeout?: number;             // Timeout for operations
}

export async function dockerComposeUp(
  composePath: string,
  options: DockerComposeUpOptions = {}
): Promise<void> {
  const args = ['up'];
  
  if (options.detach !== false) args.push('-d');
  if (options.noRecreate) args.push('--no-recreate');
  if (options.forceRecreate) args.push('--force-recreate');
  if (options.build) args.push('--build');
  if (options.removeOrphans) args.push('--remove-orphans');
  
  const result = await exec('docker-compose', args, {
    cwd: path.dirname(composePath),
    timeout: options.timeout || 120000
  });
  
  if (result.exitCode !== 0) {
    throw new Error(`Docker Compose up failed: ${result.stderr}`);
  }
}

export async function dockerComposeDown(
  composePath: string,
  options: {
    removeVolumes?: boolean;
    removeImages?: 'all' | 'local';
    timeout?: number;
  } = {}
): Promise<void> {
  const args = ['down'];
  
  if (options.removeVolumes) args.push('-v');
  if (options.removeImages) args.push('--rmi', options.removeImages);
  
  const result = await exec('docker-compose', args, {
    cwd: path.dirname(composePath),
    timeout: options.timeout || 60000
  });
  
  if (result.exitCode !== 0) {
    throw new Error(`Docker Compose down failed: ${result.stderr}`);
  }
}
```

## 🗄️ Volume Management

### Persistent Data Storage
```typescript
// From packages/dockerApi/src/volumeManager.ts
interface VolumeInfo {
  name: string;
  driver: string;
  mountpoint: string;
  labels: Record<string, string>;
  scope: 'local' | 'global';
  options?: Record<string, string>;
  usageData?: {
    size: number;
    refCount: number;
  };
}

export class VolumeManager {
  private docker: Docker;
  
  constructor(docker: Docker) {
    this.docker = docker;
  }
  
  async listVolumes(): Promise<VolumeInfo[]> {
    const result = await this.docker.listVolumes();
    return result.Volumes.map(volume => ({
      name: volume.Name,
      driver: volume.Driver,
      mountpoint: volume.Mountpoint,
      labels: volume.Labels || {},
      scope: volume.Scope as 'local' | 'global',
      options: volume.Options,
      usageData: volume.UsageData ? {
        size: volume.UsageData.Size,
        refCount: volume.UsageData.RefCount
      } : undefined
    }));
  }
  
  async createVolume(
    name: string,
    options: {
      driver?: string;
      labels?: Record<string, string>;
      driverOpts?: Record<string, string>;
    } = {}
  ): Promise<VolumeInfo> {
    const volume = await this.docker.createVolume({
      Name: name,
      Driver: options.driver || 'local',
      Labels: options.labels,
      DriverOpts: options.driverOpts
    });
    
    return {
      name: volume.Name,
      driver: volume.Driver,
      mountpoint: volume.Mountpoint,
      labels: volume.Labels || {},
      scope: volume.Scope as 'local' | 'global'
    };
  }
  
  async removeVolume(name: string, force: boolean = false): Promise<void> {
    const volume = this.docker.getVolume(name);
    await volume.remove({ force });
  }
  
  async pruneVolumes(): Promise<{ volumesDeleted: string[]; spaceReclaimed: number }> {
    const result = await this.docker.pruneVolumes();
    return {
      volumesDeleted: result.VolumesDeleted || [],
      spaceReclaimed: result.SpaceReclaimed || 0
    };
  }
}
```

### Backup and Restore
```typescript
// Volume backup and restore functionality
export class VolumeBackupManager {
  async backupVolume(
    volumeName: string,
    backupPath: string
  ): Promise<void> {
    // Create temporary container to access volume
    const container = await this.docker.createContainer({
      Image: 'alpine:latest',
      Cmd: ['tar', 'czf', '/backup/volume.tar.gz', '-C', '/data', '.'],
      WorkingDir: '/data',
      HostConfig: {
        Binds: [
          `${volumeName}:/data:ro`,
          `${backupPath}:/backup`
        ]
      }
    });
    
    await container.start();
    await container.wait();
    await container.remove();
  }
  
  async restoreVolume(
    volumeName: string,
    backupPath: string
  ): Promise<void> {
    // Create volume if it doesn't exist
    try {
      await this.docker.getVolume(volumeName).inspect();
    } catch (error) {
      if (error.statusCode === 404) {
        await this.docker.createVolume({ Name: volumeName });
      } else {
        throw error;
      }
    }
    
    // Restore data from backup
    const container = await this.docker.createContainer({
      Image: 'alpine:latest',
      Cmd: ['tar', 'xzf', '/backup/volume.tar.gz', '-C', '/data'],
      WorkingDir: '/data',
      HostConfig: {
        Binds: [
          `${volumeName}:/data`,
          `${backupPath}:/backup:ro`
        ]
      }
    });
    
    await container.start();
    await container.wait();
    await container.remove();
  }
}
```

## 🖼️ Image Management

### Image Operations
```typescript
// From packages/dockerApi/src/imageManager.ts
export class ImageManager {
  private docker: Docker;
  
  constructor(docker: Docker) {
    this.docker = docker;
  }
  
  async pullImage(
    imageName: string,
    tag: string = 'latest',
    onProgress?: (progress: PullProgress) => void
  ): Promise<void> {
    const imageRef = `${imageName}:${tag}`;
    const stream = await this.docker.pull(imageRef);
    
    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(
        stream,
        (err, result) => {
          if (err) reject(err);
          else resolve();
        },
        onProgress
      );
    });
  }
  
  async removeImage(
    imageId: string,
    options: {
      force?: boolean;
      noprune?: boolean;
    } = {}
  ): Promise<void> {
    const image = this.docker.getImage(imageId);
    await image.remove(options);
  }
  
  async pruneImages(options: {
    dangling?: boolean;
    until?: string;
    label?: string[];
  } = {}): Promise<{ imagesDeleted: string[]; spaceReclaimed: number }> {
    const filters: any = {};
    
    if (options.dangling !== undefined) {
      filters.dangling = [options.dangling.toString()];
    }
    
    if (options.until) {
      filters.until = [options.until];
    }
    
    if (options.label) {
      filters.label = options.label;
    }
    
    const result = await this.docker.pruneImages({ filters });
    
    return {
      imagesDeleted: result.ImagesDeleted?.map(img => img.Deleted || img.Untagged).filter(Boolean) || [],
      spaceReclaimed: result.SpaceReclaimed || 0
    };
  }
  
  async getImageHistory(imageId: string): Promise<ImageHistoryEntry[]> {
    const image = this.docker.getImage(imageId);
    const history = await image.history();
    
    return history.map(entry => ({
      id: entry.Id,
      created: entry.Created,
      createdBy: entry.CreatedBy,
      size: entry.Size,
      comment: entry.Comment,
      tags: entry.Tags
    }));
  }
}
```

### Image Security Scanning
```typescript
// Security scanning for Docker images
export class ImageSecurityScanner {
  async scanImage(imageId: string): Promise<SecurityScanResult> {
    // This would integrate with security scanning tools like Trivy, Clair, etc.
    const result = await this.runSecurityScan(imageId);
    
    return {
      imageId,
      scanDate: new Date(),
      vulnerabilities: result.vulnerabilities.map(vuln => ({
        id: vuln.id,
        severity: vuln.severity,
        description: vuln.description,
        fixedVersion: vuln.fixedVersion,
        references: vuln.references
      })),
      totalCount: result.vulnerabilities.length,
      severityCounts: {
        critical: result.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: result.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: result.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: result.vulnerabilities.filter(v => v.severity === 'low').length
      }
    };
  }
  
  private async runSecurityScan(imageId: string): Promise<any> {
    // Implementation would depend on chosen security scanner
    // Example: Trivy integration
    const result = await exec('trivy', ['image', '--format', 'json', imageId]);
    return JSON.parse(result.stdout);
  }
}
```

## 📊 Container Monitoring

### Resource Monitoring
```typescript
// From packages/dockerApi/src/containerMonitor.ts
interface ContainerStats {
  containerId: string;
  name: string;
  cpu: {
    usage: number;              // CPU usage percentage
    systemUsage: number;        // System CPU usage
    onlineCpus: number;         // Number of online CPUs
  };
  memory: {
    usage: number;              // Memory usage in bytes
    limit: number;              // Memory limit in bytes
    percentage: number;         // Memory usage percentage
  };
  network: {
    rxBytes: number;            // Received bytes
    txBytes: number;            // Transmitted bytes
    rxPackets: number;          // Received packets
    txPackets: number;          // Transmitted packets
  };
  blockIO: {
    readBytes: number;          // Disk read bytes
    writeBytes: number;         // Disk write bytes
  };
  timestamp: Date;
}

export class ContainerMonitor {
  private docker: Docker;
  private monitoringInterval: NodeJS.Interval | null = null;
  
  constructor(docker: Docker) {
    this.docker = docker;
  }
  
  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const container = this.docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    return this.parseStats(containerId, stats);
  }
  
  startMonitoring(
    containerIds: string[],
    callback: (stats: ContainerStats[]) => void,
    interval: number = 5000
  ): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        const stats = await Promise.all(
          containerIds.map(id => this.getContainerStats(id))
        );
        callback(stats);
      } catch (error) {
        console.error('Error collecting container stats:', error);
      }
    }, interval);
  }
  
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
  
  private parseStats(containerId: string, rawStats: any): ContainerStats {
    // Calculate CPU usage percentage
    const cpuDelta = rawStats.cpu_stats.cpu_usage.total_usage - rawStats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = rawStats.cpu_stats.system_cpu_usage - rawStats.precpu_stats.system_cpu_usage;
    const cpuUsage = (cpuDelta / systemDelta) * rawStats.cpu_stats.online_cpus * 100;
    
    // Calculate memory usage
    const memoryUsage = rawStats.memory_stats.usage - (rawStats.memory_stats.stats?.cache || 0);
    const memoryLimit = rawStats.memory_stats.limit;
    const memoryPercentage = (memoryUsage / memoryLimit) * 100;
    
    return {
      containerId,
      name: rawStats.name,
      cpu: {
        usage: cpuUsage,
        systemUsage: rawStats.cpu_stats.system_cpu_usage,
        onlineCpus: rawStats.cpu_stats.online_cpus
      },
      memory: {
        usage: memoryUsage,
        limit: memoryLimit,
        percentage: memoryPercentage
      },
      network: {
        rxBytes: Object.values(rawStats.networks || {}).reduce((sum: number, net: any) => sum + net.rx_bytes, 0),
        txBytes: Object.values(rawStats.networks || {}).reduce((sum: number, net: any) => sum + net.tx_bytes, 0),
        rxPackets: Object.values(rawStats.networks || {}).reduce((sum: number, net: any) => sum + net.rx_packets, 0),
        txPackets: Object.values(rawStats.networks || {}).reduce((sum: number, net: any) => sum + net.tx_packets, 0)
      },
      blockIO: {
        readBytes: rawStats.blkio_stats.io_service_bytes_recursive?.find((item: any) => item.op === 'Read')?.value || 0,
        writeBytes: rawStats.blkio_stats.io_service_bytes_recursive?.find((item: any) => item.op === 'Write')?.value || 0
      },
      timestamp: new Date()
    };
  }
}
```

### Health Checks
```typescript
// Container health monitoring
export class ContainerHealthChecker {
  async checkContainerHealth(containerId: string): Promise<HealthStatus> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();
    
    const health = info.State.Health;
    
    if (!health) {
      return {
        status: 'no-healthcheck',
        message: 'No health check configured'
      };
    }
    
    return {
      status: health.Status,
      message: health.Log?.[0]?.Output,
      failingStreak: health.FailingStreak,
      lastCheck: new Date(health.Log?.[0]?.Start)
    };
  }
  
  async setHealthCheck(
    containerId: string,
    healthcheck: {
      test: string[];
      interval?: string;
      timeout?: string;
      retries?: number;
      startPeriod?: string;
    }
  ): Promise<void> {
    // This would typically be done through docker-compose.yml
    // or during container creation, not after the fact
    throw new Error('Health checks must be configured during container creation');
  }
}
```

## 🔧 Advanced Docker Features

### Multi-stage Builds
```dockerfile
# Example Dockerfile for DAppNode packages
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Security hardening
RUN addgroup -g 1001 -S dappnode && \
    adduser -S dappnode -u 1001 -G dappnode
USER 1001

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "index.js"]
```

### Resource Constraints
```typescript
// Resource limits for containers
interface ResourceLimits {
  memory?: string;              // Memory limit (e.g., "1g", "512m")
  memorySwap?: string;          // Memory + swap limit
  cpus?: string;                // CPU limit (e.g., "1.5", "2")
  cpuShares?: number;           // CPU shares (relative weight)
  blkioWeight?: number;         // Block I/O weight
  ulimits?: Array<{
    name: string;
    soft: number;
    hard: number;
  }>;
}

export function applyResourceLimits(
  containerConfig: any,
  limits: ResourceLimits
): any {
  const hostConfig = containerConfig.HostConfig || {};
  
  if (limits.memory) {
    hostConfig.Memory = parseMemoryString(limits.memory);
  }
  
  if (limits.memorySwap) {
    hostConfig.MemorySwap = parseMemoryString(limits.memorySwap);
  }
  
  if (limits.cpus) {
    hostConfig.NanoCpus = parseFloat(limits.cpus) * 1e9;
  }
  
  if (limits.cpuShares) {
    hostConfig.CpuShares = limits.cpuShares;
  }
  
  if (limits.ulimits) {
    hostConfig.Ulimits = limits.ulimits;
  }
  
  return {
    ...containerConfig,
    HostConfig: hostConfig
  };
}
```

## 🔗 Related Systems

- **[Architecture Overview](Architecture-Overview.md)**: Overall system design
- **[Package Installer & Repository](Package-Installer-Repository.md)**: Package deployment
- **[Networking](Networking.md)**: Container networking
- **[Monitoring & Metrics](Monitoring-Metrics.md)**: Container monitoring

---

> **Technical Implementation**: Docker integration is implemented in `packages/dockerApi/` and `packages/dockerCompose/` with comprehensive container lifecycle management, volume handling, and monitoring capabilities using the Docker API and Docker Compose.