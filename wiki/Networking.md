# 🌐 Networking

DAppNode's networking system provides seamless connectivity between containers, external services, and end users through a sophisticated Docker networking architecture combined with DNS resolution, port forwarding, and accessibility features.

## 🏗️ Network Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DAppNode Network Stack                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Admin UI  │  │    Bind     │  │   Package Services  │ │
│  │ my.dappnode │  │ DNS Server  │  │    (Various IPs)    │ │
│  │172.33.1.7   │  │172.33.1.2   │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    dncore_network                           │
│                   172.33.0.0/16                            │
├─────────────────────────────────────────────────────────────┤
│                Docker Bridge Network                        │
├─────────────────────────────────────────────────────────────┤
│                  Host Network Stack                         │
│                 (Ubuntu/Debian)                            │
└─────────────────────────────────────────────────────────────┘
```

## 🐳 Docker Networks and Aliases

### Core Network Configuration
DAppNode creates and manages a dedicated Docker network for all packages:

```typescript
// From packages/daemons/src/dockerNetworkConfigs/index.ts
async function ensureDockerNetworkConfig({
  networkName,    // "dncore_network"
  subnet,         // "172.33.0.0/16"
  dappmanagerIp,  // "172.33.1.7"
  bindIp          // "172.33.1.2"
}: NetworkConfig): Promise<void> {
  // 1. Create the new docker network
  await createDockerNetwork({ networkName, subnet });
  
  // 2. Connect all DAppNode packages to the network
  const packages = await packagesGet();
  for (const pkg of packages) {
    writeDockerNetworkConfig({ pkg, networkName });
    await dockerComposeUpPackage({ 
      dnpName: pkg.dnpName,
      upAll: false,
      dockerComposeUpOptions: { noRecreate: true }
    });
  }
}
```

### Network Segmentation
DAppNode uses multiple network segments for different purposes:

#### Core Network (`dncore_network`)
- **Purpose**: System-critical services and user packages
- **Subnet**: `172.33.0.0/16` (65,536 IP addresses)
- **Reserved IPs**:
  - `172.33.1.2`: Bind DNS server
  - `172.33.1.7`: DAppManager and Admin UI
  - `172.33.1.x`: Core services  
  - `172.33.x.x`: User packages (auto-assigned)

#### Staker Network (`staker_network`)
- **Purpose**: Ethereum staking infrastructure
- **Isolation**: Separated from general packages for security
- **Components**: Execution clients, consensus clients, validators

```typescript
// From packages/daemons/src/dockerNetworkConfigs/createStakerNetworkAndConnectStakerPkgs.ts
export async function createStakerNetworkAndConnectStakerPkgs(
  execution: Execution,
  consensus: Consensus,
  signer: Signer,
  mevBoost: MevBoost
): Promise<void> {
  // Create isolated network for staking infrastructure
  await createDockerNetwork({
    networkName: params.STAKER_NETWORK_NAME,
    subnet: params.STAKER_NETWORK_SUBNET
  });
  
  // Connect staking packages to both networks
  const stakerPackages = [execution, consensus, signer, mevBoost];
  for (const pkg of stakerPackages) {
    await connectPkgContainers(pkg, params.STAKER_NETWORK_NAME);
  }
}
```

### Container Aliases
Each package gets predictable network aliases:

```yaml
# docker-compose.yml example
services:
  geth:
    image: ethereum/client-go:latest
    networks:
      dncore_network:
        aliases:
          - geth.dappnode           # Primary alias
          - geth                    # Short alias
          - execution.eth.dappnode  # Functional alias
```

## 📍 DNS Resolution with Bind

### Bind DNS Server
DAppNode runs its own DNS server (Bind9) to provide:
- **Internal Service Discovery**: Packages find each other by name
- **External DNS Resolution**: Standard internet DNS queries
- **Custom Domain Routing**: `.dappnode` domain resolution

```typescript
// From packages/dappmanager/src/calls/bindDnpService.ts
interface DnsRecord {
  name: string;        // "geth.dappnode"
  type: "A" | "CNAME"; // Record type
  target: string;      // IP address or hostname
  ttl?: number;        // Time to live
}

export async function updateDnsRecords(records: DnsRecord[]): Promise<void> {
  // Updates Bind configuration with new DNS records
  // Reloads DNS server to apply changes
}
```

### DNS Query Flow
```
User Request: http://geth.dappnode
     │
     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │───►│ Bind Server │───►│   Package   │
│             │    │ 172.33.1.2  │    │    Geth     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Dynamic DNS Updates
As packages are installed/removed, DNS records are automatically updated:

```typescript
// From packages/daemons/src/dockerNetworkConfigs/writeDockerNetworkConfig.ts
export function writeDockerNetworkConfig({
  pkg,
  networkName
}: {
  pkg: InstalledPackageDataApiReturn;
  networkName: string;
}): void {
  // 1. Read existing docker-compose.yml
  const compose = readComposeFile(pkg.composePath);
  
  // 2. Add network configuration to all services
  for (const serviceName in compose.services) {
    compose.services[serviceName].networks = {
      [networkName]: {
        aliases: [
          `${serviceName}.${pkg.dnpName}`,
          `${serviceName}.dappnode`,
          serviceName
        ]
      }
    };
  }
  
  // 3. Write updated compose file
  writeComposeFile(pkg.composePath, compose);
}
```

## 🔓 Package Accessibility

### Access Control Mechanisms
DAppNode provides multiple ways to control package access:

#### Internal-Only Packages
- **No external access**: Only accessible within DAppNode network
- **Example**: Database services, internal APIs
- **Security**: Protected from external threats

#### Public Access (HTTP/HTTPS)
- **Web interface exposure**: Accessible via browser
- **Domain mapping**: Custom domains like `grafana.dappnode`
- **HTTPS termination**: Automatic SSL certificates

#### Custom Port Exposure
```yaml
# docker-compose.yml
services:
  service:
    ports:
      - "8080:80"    # Expose port 80 as 8080 on host
      - "443:443"    # Direct HTTPS exposure
```

### HTTPS Portal Integration
DAppNode includes an HTTPS portal for secure web access:

```typescript
// From packages/httpsPortal/src/index.ts
interface HttpsPortalConfig {
  domain: string;           // "grafana.dappnode"
  targetUrl: string;        // "http://grafana:3000"
  ssl: boolean;             // Enable HTTPS
  forceSSL: boolean;        // Redirect HTTP to HTTPS
  certificateSource: 'letsencrypt' | 'self-signed';
}
```

### Access Patterns
1. **Direct Access**: `http://packagename.dappnode:port`
2. **Proxied Access**: `https://packagename.dappnode` (via HTTPS portal)
3. **Admin UI Integration**: Embedded iframes or links
4. **API Access**: RESTful APIs with authentication

## 🌍 External Connectivity

### Port Forwarding and UPnP
DAppNode automatically configures router port forwarding:

```typescript
// From packages/upnpc/src/upnpc.ts
interface PortMapping {
  internalPort: number;    // Port inside DAppNode
  externalPort: number;    // Port on router
  protocol: 'TCP' | 'UDP'; // Network protocol
  description: string;     // Human-readable description
}

export async function addUPnPMapping(mapping: PortMapping): Promise<void> {
  // Uses UPnP protocol to configure router automatically
  // Creates NAT traversal rules for external access
}
```

### Common Port Mappings
- **22/TCP**: SSH access (if enabled)
- **80/TCP**: HTTP web interface
- **443/TCP**: HTTPS web interface  
- **30303/TCP**: Ethereum P2P (Geth)
- **9000/TCP**: Ethereum Beacon (Prysm)
- **Custom**: Package-specific ports

### UPnP Discovery Process
```
1. DAppNode discovers router via UPnP
2. Queries existing port mappings
3. Creates necessary port forwards
4. Monitors and refreshes mappings
5. Removes mappings when packages are uninstalled
```

## 🔧 Advanced Networking Features

### Load Balancing
For packages with multiple instances:

```yaml
# docker-compose.yml with load balancing
services:
  app:
    image: myapp:latest
    deploy:
      replicas: 3
    networks:
      - dncore_network
  
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    networks:
      - dncore_network
```

### Service Mesh Integration
- **Inter-service Communication**: Secure communication between packages
- **Traffic Management**: Advanced routing and load balancing
- **Observability**: Network traffic monitoring and analysis

### VPN Integration
DAppNode supports VPN connections for secure remote access:

```typescript
// VPN configuration for remote access
interface VpnConfig {
  protocol: 'OpenVPN' | 'WireGuard';
  serverAddress: string;
  port: number;
  encryption: string;
  authentication: 'certificate' | 'psk';
}
```

## 📊 Network Monitoring

### Connection Health Monitoring
```typescript
// From packages/notifications/src/networkMonitoring.ts
interface NetworkHealthCheck {
  target: string;           // Target service
  type: 'http' | 'tcp' | 'udp' | 'icmp';
  timeout: number;          // Connection timeout
  interval: number;         // Check interval
  expectedResponse?: string; // Expected response content
}

export async function checkNetworkHealth(checks: NetworkHealthCheck[]): Promise<HealthReport> {
  // Performs network connectivity checks
  // Reports on service availability and performance
}
```

### Traffic Analytics
- **Bandwidth Usage**: Per-package network usage tracking
- **Connection Patterns**: Inter-service communication analysis
- **Performance Metrics**: Latency, throughput, error rates

### Network Troubleshooting
Built-in tools for network diagnosis:

```typescript
// Network diagnostic tools
export async function runNetworkDiagnostics(): Promise<DiagnosticReport> {
  return {
    dnsResolution: await testDnsResolution(),
    containerConnectivity: await testContainerConnectivity(),
    externalConnectivity: await testExternalConnectivity(),
    portAccessibility: await testPortAccessibility(),
    upnpStatus: await checkUpnpStatus()
  };
}
```

## 🛡️ Network Security

### Firewall Configuration
- **Default Deny**: Block all unnecessary traffic
- **Whitelist Rules**: Allow only required connections
- **Package Isolation**: Prevent unauthorized inter-package communication

### SSL/TLS Termination
```typescript
// Automatic SSL certificate management
interface CertificateConfig {
  domain: string;
  provider: 'letsencrypt' | 'self-signed';
  autoRenewal: boolean;
  keySize: 2048 | 4096;
}
```

### Network Segmentation Security
- **Core Services Protection**: Critical services on separate subnet
- **User Package Isolation**: Prevent packages from accessing core services
- **Staker Network Security**: Dedicated network for staking infrastructure

## 🔗 Related Systems

- **[Docker Integration](Docker-Integration.md)**: Container orchestration and networking
- **[PoS in DAppNode](PoS-in-DAppNode.md)**: Staker network configuration
- **[Admin UI](Admin-UI.md)**: Network management interface
- **[Monitoring & Metrics](Monitoring-Metrics.md)**: Network performance monitoring

---

> **Technical Implementation**: The networking system is implemented across multiple packages including `packages/daemons/src/dockerNetworkConfigs/`, `packages/httpsPortal/`, and `packages/upnpc/`.