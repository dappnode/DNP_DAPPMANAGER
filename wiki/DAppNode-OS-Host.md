# 🖥️ DAppNode OS Installer & Host

DAppNode OS provides the foundational layer for running DAppNode infrastructure, including the operating system installation, host system integration, and system services that enable seamless blockchain node operation.

## 🏗️ Host System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DAppNode Host Stack                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  DAppNode    │  │    Docker    │  │  Host Scripts    │  │
│  │  Packages    │  │   Runtime    │  │   & Services     │  │
│  │ (Containers) │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      DAppNode OS                           │
│                 (Ubuntu/Debian Base)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   systemd    │  │   Network    │  │   File System    │  │
│  │   Services   │  │   Manager    │  │   Management     │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                    Hardware Layer                          │
│              (x86_64, ARM64, Raspberry Pi)                 │
└─────────────────────────────────────────────────────────────┘
```

## 🐧 Ubuntu & Debian Support

### Supported Operating Systems
DAppNode supports multiple Linux distributions:

```typescript
// From packages/hostScriptsServices/src/hostInfo.ts
interface SupportedOS {
  distribution: string;
  version: string;
  architecture: string;
  support: 'full' | 'partial' | 'experimental';
}

const SUPPORTED_SYSTEMS: SupportedOS[] = [
  // Ubuntu LTS Releases
  { distribution: 'ubuntu', version: '22.04', architecture: 'x86_64', support: 'full' },
  { distribution: 'ubuntu', version: '22.04', architecture: 'arm64', support: 'full' },
  { distribution: 'ubuntu', version: '20.04', architecture: 'x86_64', support: 'full' },
  
  // Debian Releases
  { distribution: 'debian', version: '12', architecture: 'x86_64', support: 'full' },
  { distribution: 'debian', version: '11', architecture: 'x86_64', support: 'full' },
  { distribution: 'debian', version: '11', architecture: 'arm64', support: 'partial' },
  
  // Specialized Hardware
  { distribution: 'raspios', version: '11', architecture: 'arm64', support: 'experimental' }
];
```

### Operating System Requirements
```typescript
// System requirements validation
interface SystemRequirements {
  cpu: {
    cores: number;              // Minimum CPU cores
    architecture: string[];     // Supported architectures
  };
  memory: {
    minimum: string;            // Minimum RAM (e.g., "4GB")
    recommended: string;        // Recommended RAM (e.g., "8GB")
  };
  storage: {
    minimum: string;            // Minimum storage (e.g., "100GB")
    recommended: string;        // Recommended storage (e.g., "1TB")
    type: string[];            // Supported storage types ["SSD", "HDD"]
  };
  network: {
    ethernet: boolean;          // Ethernet connection required
    bandwidth: string;          // Minimum bandwidth
  };
}

const MINIMUM_REQUIREMENTS: SystemRequirements = {
  cpu: { cores: 2, architecture: ['x86_64', 'arm64'] },
  memory: { minimum: '4GB', recommended: '8GB' },
  storage: { minimum: '100GB', recommended: '1TB', type: ['SSD'] },
  network: { ethernet: true, bandwidth: '10Mbps' }
};
```

### OS Installation Methods

#### 1. ISO Installation
Pre-built ISO images with DAppNode pre-installed:

```bash
# ISO creation process
# 1. Base OS installation (Ubuntu/Debian)
# 2. Docker installation and configuration
# 3. DAppNode core services installation
# 4. System optimization and hardening
# 5. ISO image generation

# Download and flash ISO
wget https://github.com/dappnode/DAppNode/releases/latest/dappnode-ubuntu-22.04-x86_64.iso
sudo dd if=dappnode-ubuntu-22.04-x86_64.iso of=/dev/sdX bs=4M status=progress
```

#### 2. Script Installation
Installation on existing Ubuntu/Debian systems:

```bash
# Quick installation script
curl -sSL https://installer.dappnode.io | sudo bash

# Manual installation with options
wget -O - https://installer.dappnode.io/install.sh | sudo bash -s -- \
  --skip-docker \              # Skip Docker installation
  --skip-reboot \              # Skip automatic reboot
  --network-interface eth0     # Specify network interface
```

#### 3. Cloud Installation
Support for cloud providers:

```yaml
# cloud-init configuration
#cloud-config
packages:
  - docker.io
  - docker-compose
  - curl
  - wget

runcmd:
  - curl -sSL https://installer.dappnode.io | bash
  - systemctl enable dappnode
  - systemctl start dappnode
```

## 🔧 Host Scripts

### System Integration Scripts
DAppNode provides various host-level scripts for system integration:

```typescript
// From packages/hostScriptsServices/src/hostScripts.ts
interface HostScript {
  name: string;
  description: string;
  path: string;
  permissions: string;         // File permissions (e.g., "755")
  runLevel: 'user' | 'root';   // Required privileges
  category: 'network' | 'storage' | 'system' | 'monitoring';
}

const HOST_SCRIPTS: HostScript[] = [
  {
    name: 'disk-usage-monitor',
    description: 'Monitor disk usage and send alerts',
    path: '/usr/local/bin/dappnode-disk-monitor',
    permissions: '755',
    runLevel: 'root',
    category: 'monitoring'
  },
  {
    name: 'network-setup',
    description: 'Configure network interfaces and routing',
    path: '/usr/local/bin/dappnode-network-setup',
    permissions: '755', 
    runLevel: 'root',
    category: 'network'
  },
  {
    name: 'firewall-config',
    description: 'Configure UFW firewall rules',
    path: '/usr/local/bin/dappnode-firewall',
    permissions: '755',
    runLevel: 'root',
    category: 'network'
  }
];
```

### Common Host Scripts

#### Network Configuration
```bash
#!/bin/bash
# /usr/local/bin/dappnode-network-setup
# Configure network interfaces for DAppNode

set -e

INTERFACE=${1:-eth0}
DAPPNODE_SUBNET="172.33.0.0/16"

# Configure bridge interface
docker network create \
  --driver bridge \
  --subnet=$DAPPNODE_SUBNET \
  --gateway=172.33.0.1 \
  dncore_network || true

# Enable IP forwarding
echo 'net.ipv4.ip_forward=1' >> /etc/sysctl.conf
sysctl -p

# Configure iptables rules
iptables -t nat -A POSTROUTING -s $DAPPNODE_SUBNET ! -o docker0 -j MASQUERADE
iptables-save > /etc/iptables/rules.v4

echo "Network configuration completed for interface $INTERFACE"
```

#### Storage Management
```bash
#!/bin/bash
# /usr/local/bin/dappnode-storage-setup
# Configure storage and disk management

set -e

DOCKER_ROOT="/var/lib/docker"
DAPPNODE_DATA="/usr/src/dappnode"
MIN_FREE_SPACE=10  # GB

# Check available disk space
check_disk_space() {
    local path=$1
    local available=$(df -BG "$path" | tail -1 | awk '{print $4}' | sed 's/G//')
    
    if [ "$available" -lt "$MIN_FREE_SPACE" ]; then
        echo "Warning: Low disk space on $path ($available GB available)"
        # Send notification to DAppNode
        curl -X POST http://localhost:8080/api/notification \
             -H "Content-Type: application/json" \
             -d "{\"type\": \"warning\", \"message\": \"Low disk space: $available GB\"}"
    fi
}

# Configure Docker storage driver
configure_docker_storage() {
    cat > /etc/docker/daemon.json << EOF
{
    "storage-driver": "overlay2",
    "data-root": "$DOCKER_ROOT",
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    }
}
EOF
    
    systemctl restart docker
}

# Main execution
check_disk_space "/"
check_disk_space "$DOCKER_ROOT"
configure_docker_storage
```

### Script Management
```typescript
// Host script execution and management
export class HostScriptManager {
  private scriptsPath = '/usr/local/bin';
  
  async executeScript(
    scriptName: string,
    args: string[] = [],
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const scriptPath = path.join(this.scriptsPath, scriptName);
    
    // Validate script exists and is executable
    await this.validateScript(scriptPath);
    
    // Execute with proper privileges
    const result = await this.executeWithPrivileges(scriptPath, args, options);
    
    // Log execution result
    await this.logExecution(scriptName, args, result);
    
    return result;
  }
  
  private async validateScript(scriptPath: string): Promise<void> {
    const stats = await fs.stat(scriptPath);
    
    if (!stats.isFile()) {
      throw new Error(`Script not found: ${scriptPath}`);
    }
    
    // Check execute permissions
    const mode = stats.mode & parseInt('777', 8);
    if (!(mode & parseInt('111', 8))) {
      throw new Error(`Script not executable: ${scriptPath}`);
    }
  }
}
```

## ⚙️ Host Services

### systemd Service Management
DAppNode integrates with systemd for service management:

```typescript
// From packages/hostScriptsServices/src/hostServices.ts
interface SystemdService {
  name: string;
  description: string;
  type: 'simple' | 'forking' | 'oneshot' | 'notify';
  execStart: string;
  execStop?: string;
  restart: 'no' | 'always' | 'on-failure';
  user?: string;
  group?: string;
  environment?: Record<string, string>;
  dependencies: string[];      // Service dependencies
}

const DAPPNODE_SERVICES: SystemdService[] = [
  {
    name: 'dappnode-core',
    description: 'DAppNode Core Service Manager',
    type: 'simple',
    execStart: '/usr/local/bin/dappnode-core-start',
    restart: 'always',
    user: 'root',
    dependencies: ['docker.service', 'network-online.target']
  },
  {
    name: 'dappnode-monitor',
    description: 'DAppNode System Monitor',
    type: 'simple',
    execStart: '/usr/local/bin/dappnode-monitor',
    restart: 'on-failure',
    user: 'dappnode',
    dependencies: ['dappnode-core.service']
  }
];
```

### Service Configuration Files
```ini
# /etc/systemd/system/dappnode-core.service
[Unit]
Description=DAppNode Core Service Manager
After=docker.service network-online.target
Wants=network-online.target
Requires=docker.service

[Service]
Type=simple
ExecStart=/usr/local/bin/dappnode-core-start
ExecStop=/usr/local/bin/dappnode-core-stop
Restart=always
RestartSec=10
User=root
Group=root

# Environment variables
Environment=DAPPNODE_DATA_DIR=/usr/src/dappnode
Environment=DOCKER_COMPOSE_CMD=docker-compose

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=/usr/src/dappnode /var/lib/docker

[Install]
WantedBy=multi-user.target
```

### Service Management API
```typescript
// Service control interface
export class HostServiceManager {
  async startService(serviceName: string): Promise<void> {
    await this.executeSystemctl(['start', serviceName]);
    await this.waitForServiceState(serviceName, 'active');
  }
  
  async stopService(serviceName: string): Promise<void> {
    await this.executeSystemctl(['stop', serviceName]);
    await this.waitForServiceState(serviceName, 'inactive');
  }
  
  async restartService(serviceName: string): Promise<void> {
    await this.executeSystemctl(['restart', serviceName]);
    await this.waitForServiceState(serviceName, 'active');
  }
  
  async getServiceStatus(serviceName: string): Promise<ServiceStatus> {
    const result = await this.executeSystemctl(['status', serviceName, '--no-pager']);
    
    return {
      name: serviceName,
      active: result.stdout.includes('Active: active'),
      enabled: result.stdout.includes('Loaded: loaded'),
      uptime: this.parseUptime(result.stdout),
      memory: this.parseMemoryUsage(result.stdout),
      pid: this.parsePid(result.stdout)
    };
  }
  
  private async executeSystemctl(args: string[]): Promise<ExecutionResult> {
    return await exec('systemctl', args, { timeout: 30000 });
  }
}
```

## 🔒 System Security & Hardening

### Security Configuration
DAppNode applies security hardening during installation:

```bash
#!/bin/bash
# Security hardening script

# 1. Update system packages
apt update && apt upgrade -y

# 2. Configure firewall (UFW)
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (if enabled)
ufw allow 22/tcp

# Allow DAppNode web interface
ufw allow 80/tcp
ufw allow 443/tcp

# Allow P2P ports for blockchain clients
ufw allow 30303/tcp  # Ethereum
ufw allow 30303/udp
ufw allow 9000/tcp   # Beacon chain
ufw allow 9000/udp

ufw --force enable

# 3. Configure SSH (if enabled)
if systemctl is-enabled ssh >/dev/null 2>&1; then
    # Disable root login
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Use key-based authentication only
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    
    systemctl restart ssh
fi

# 4. Configure automatic security updates
cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

# 5. Configure fail2ban
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### User Management
```typescript
// User and permission management
interface DAppNodeUser {
  username: string;
  uid: number;
  gid: number;
  groups: string[];
  shell: string;
  homeDir: string;
  sudoAccess: boolean;
}

const DAPPNODE_USERS: DAppNodeUser[] = [
  {
    username: 'dappnode',
    uid: 1000,
    gid: 1000,
    groups: ['docker', 'sudo'],
    shell: '/bin/bash',
    homeDir: '/home/dappnode',
    sudoAccess: true
  },
  {
    username: 'dappnode-services',
    uid: 1001,
    gid: 1001,
    groups: ['docker'],
    shell: '/bin/false',
    homeDir: '/var/lib/dappnode',
    sudoAccess: false
  }
];
```

## 📊 System Monitoring

### Host System Metrics
```typescript
// From packages/hostScriptsServices/src/systemMetrics.ts
interface SystemMetrics {
  timestamp: number;
  
  // CPU metrics
  cpu: {
    usage: number;              // CPU usage percentage
    loadAverage: number[];      // 1, 5, 15 minute load averages
    temperature?: number;       // CPU temperature (if available)
  };
  
  // Memory metrics
  memory: {
    total: number;              // Total memory in bytes
    available: number;          // Available memory in bytes
    used: number;               // Used memory in bytes
    cached: number;             // Cached memory in bytes
    buffers: number;            // Buffer memory in bytes
  };
  
  // Storage metrics
  storage: {
    total: number;              // Total storage in bytes
    available: number;          // Available storage in bytes
    used: number;               // Used storage in bytes
    iops: {
      read: number;             // Read IOPS
      write: number;            // Write IOPS
    };
  };
  
  // Network metrics
  network: {
    interfaces: NetworkInterface[];
    totalBytes: {
      received: number;
      transmitted: number;
    };
  };
  
  // System info
  system: {
    uptime: number;             // System uptime in seconds
    processes: number;          // Number of running processes
    users: number;              // Number of logged-in users
    kernel: string;             // Kernel version
  };
}
```

### Health Monitoring
```typescript
// System health monitoring
export class SystemHealthMonitor {
  private checkInterval = 30000; // 30 seconds
  
  async startMonitoring(): Promise<void> {
    setInterval(async () => {
      const metrics = await this.collectSystemMetrics();
      const health = await this.assessSystemHealth(metrics);
      
      if (health.issues.length > 0) {
        await this.sendHealthAlert(health);
      }
      
      await this.storeMetrics(metrics);
    }, this.checkInterval);
  }
  
  private async assessSystemHealth(metrics: SystemMetrics): Promise<HealthAssessment> {
    const issues: HealthIssue[] = [];
    
    // Check CPU usage
    if (metrics.cpu.usage > 90) {
      issues.push({
        type: 'cpu_high',
        severity: 'warning',
        message: `High CPU usage: ${metrics.cpu.usage}%`
      });
    }
    
    // Check memory usage
    const memoryUsage = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsage > 85) {
      issues.push({
        type: 'memory_high',
        severity: 'warning',
        message: `High memory usage: ${memoryUsage.toFixed(1)}%`
      });
    }
    
    // Check disk space
    const diskUsage = (metrics.storage.used / metrics.storage.total) * 100;
    if (diskUsage > 80) {
      issues.push({
        type: 'disk_full',
        severity: diskUsage > 90 ? 'critical' : 'warning',
        message: `Low disk space: ${(100 - diskUsage).toFixed(1)}% remaining`
      });
    }
    
    return {
      timestamp: Date.now(),
      status: issues.length === 0 ? 'healthy' : 'issues',
      issues
    };
  }
}
```

### Log Management
```typescript
// System log management
interface LogConfig {
  service: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  rotation: {
    maxSize: string;            // e.g., "100MB"
    maxFiles: number;           // Number of files to keep
    compress: boolean;          // Compress rotated files
  };
  destination: 'file' | 'syslog' | 'journal';
}

const LOG_CONFIGS: LogConfig[] = [
  {
    service: 'dappnode-core',
    level: 'info',
    rotation: { maxSize: '50MB', maxFiles: 5, compress: true },
    destination: 'journal'
  },
  {
    service: 'docker',
    level: 'warn',
    rotation: { maxSize: '100MB', maxFiles: 3, compress: true },
    destination: 'file'
  }
];
```

## 🔗 Related Systems

- **[Docker Integration](Docker-Integration.md)**: Container runtime and orchestration
- **[Networking](Networking.md)**: Network configuration and management
- **[Monitoring & Metrics](Monitoring-Metrics.md)**: System performance monitoring
- **[Admin UI](Admin-UI.md)**: Host system management interface

---

> **Technical Implementation**: Host system integration is implemented in `packages/hostScriptsServices/` with comprehensive support for Ubuntu/Debian systems, systemd service management, and system monitoring capabilities.