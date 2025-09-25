# 🔔 Notifications

DAppNode's notification system provides comprehensive monitoring, alerting, and communication capabilities to keep users informed about system status, package updates, validator performance, and critical events across their DAppNode infrastructure.

## 🏗️ Notification Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DAppNode Notification System              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Event     │  │ Notification │  │    Delivery      │  │
│  │  Collectors  │─►│   Engine     │─►│    Channels      │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │    Gatus     │  │    Custom    │  │    WebPush      │  │
│  │  Monitoring  │  │   Endpoints  │  │ Remote Delivery │  │
│  │              │  │              │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Subscription Management                        │
└─────────────────────────────────────────────────────────────┘
```

## 📬 WebPush Integration

### Browser Push Notifications
DAppNode supports WebPush notifications for real-time alerts:

```typescript
// From packages/notifications/src/webpush.ts
interface WebPushConfig {
  publicKey: string;        // VAPID public key
  privateKey: string;       // VAPID private key
  subject: string;          // Contact information
  
  // Push service configuration
  endpoint: string;         // Browser push service endpoint
  ttl: number;             // Time to live for notifications
  urgency: 'very-low' | 'low' | 'normal' | 'high';
}

export async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<void> {
  const options = {
    TTL: payload.ttl || 86400,     // 24 hours default
    urgency: payload.urgency || 'normal',
    topic: payload.topic,
    headers: {
      'Vapid-Subject': config.subject
    }
  };
  
  await webpush.sendNotification(subscription, JSON.stringify(payload), options);
}
```

### Push Notification Types
```typescript
// Notification payload structure
interface NotificationPayload {
  title: string;            // Notification title
  body: string;             // Notification body text
  icon?: string;            // Icon URL
  badge?: string;           // Badge icon URL
  image?: string;           // Large image URL
  
  // Interaction
  actions?: NotificationAction[]; // Action buttons
  requireInteraction?: boolean;   // Persist until user interaction
  
  // Metadata
  tag?: string;             // Notification identifier
  timestamp?: number;       // Event timestamp
  data?: any;              // Custom data payload
  
  // Delivery options
  ttl?: number;            // Time to live
  urgency?: 'very-low' | 'low' | 'normal' | 'high';
  topic?: string;          // Notification topic/category
}

interface NotificationAction {
  action: string;          // Action identifier
  title: string;           // Button text
  icon?: string;           // Button icon
}
```

## 📝 Subscription Management

### User Subscription System
Users can subscribe to different types of notifications:

```typescript
// From packages/admin-ui/src/pages/notifications/
interface NotificationSubscription {
  userId: string;
  endpoint: string;            // Push service endpoint
  keys: {
    p256dh: string;           // Client public key
    auth: string;             // Authentication secret
  };
  
  // Subscription preferences
  preferences: {
    packageUpdates: boolean;   // Package update notifications
    systemAlerts: boolean;     // Critical system alerts
    validatorAlerts: boolean;  // Staking validator alerts
    performanceReports: boolean; // Performance summaries
    maintenanceNotices: boolean; // System maintenance
  };
  
  // Delivery settings
  quietHours: {
    enabled: boolean;
    start: string;            // "22:00"
    end: string;              // "08:00"
    timezone: string;         // "UTC"
  };
  
  // Filtering
  severityFilter: 'all' | 'warning' | 'critical';
  packageFilter: string[];   // Only notifications for specific packages
}
```

### Preference Management UI
```typescript
// From packages/admin-ui/src/pages/notifications/tabs/Settings/
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>();
  const [subscription, setSubscription] = useState<PushSubscription>();
  
  const updatePreferences = async (newPrefs: NotificationPreferences) => {
    await api.notificationPreferencesSet(newPrefs);
    setPreferences(newPrefs);
  };
  
  const enablePushNotifications = async () => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidPublicKey
    });
    
    await api.notificationSubscriptionAdd(subscription);
    setSubscription(subscription);
  };
}
```

## 🔍 Gatus vs Custom Monitoring

### Gatus Integration
DAppNode integrates with **Gatus** for comprehensive service monitoring:

```yaml
# From notifications.yaml
customEndpoints:
  - name: "Package updates notifications"
    isBanner: false
    correlationId: "dappmanager-update-pkg"  
    description: "This endpoint notifies users about available package updates."
    enabled: true
```

#### Gatus Monitoring Features
```typescript
// Gatus endpoint configuration
interface GatusEndpoint {
  name: string;                 // Human-readable name
  url: string;                  // URL to monitor
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  interval: string;             // Check interval (e.g., "30s")
  timeout: string;              // Request timeout (e.g., "10s")
  
  // Health conditions
  conditions: GatusCondition[]; // Success/failure conditions
  
  // Alerting
  alerts: GatusAlert[];         // Alert configurations
  
  // UI configuration
  group: string;                // Grouping for UI
  enabled: boolean;             // Enable/disable monitoring
}

interface GatusCondition {
  condition: string;            // "[STATUS] == 200"
  success?: boolean;            // Whether condition indicates success
}

interface GatusAlert {
  type: 'discord' | 'email' | 'webhook' | 'telegram';
  enabled: boolean;
  failureThreshold: number;     // Failures before alerting
  successThreshold: number;     // Successes before recovery
  sendOnResolved: boolean;      // Send recovery notification
}
```

### Custom Endpoint Monitoring
DAppNode also supports custom monitoring endpoints:

```typescript
// From packages/admin-ui/src/pages/notifications/tabs/Settings/ManagePackageNotifications.tsx
interface CustomEndpoint {
  name: string;                 // Endpoint name
  url: string;                  // URL to monitor
  method: 'GET' | 'POST';       // HTTP method
  headers?: Record<string, string>; // Custom headers
  body?: string;                // Request body for POST
  timeout: number;              // Timeout in seconds
  interval: number;             // Check interval in seconds
  
  // Success criteria
  expectedStatus: number[];     // Expected HTTP status codes
  expectedBody?: string;        // Expected response body content
  
  // Notification settings
  enabled: boolean;
  notifyOnFailure: boolean;
  notifyOnRecovery: boolean;
  failureThreshold: number;     // Consecutive failures before alert
}
```

### Monitoring Comparison

| Feature | Gatus | Custom Endpoints |
|---------|-------|------------------|
| **Configuration** | YAML-based | UI-based |
| **Complexity** | Advanced monitoring | Simple health checks |
| **Alerting** | Multiple channels | DAppNode notifications |
| **UI** | Dedicated status page | Integrated in Admin UI |
| **Flexibility** | High configuration options | Basic but easy to use |
| **Performance** | Optimized for monitoring | Lightweight checks |

## 📋 notifications.yaml Configuration

### Configuration File Structure
Each package can include a `notifications.yaml` file:

```yaml
# Package notification configuration
customEndpoints:
  - name: "Service Health Check"
    description: "Monitors the main service endpoint"
    correlationId: "service-health"
    isBanner: false
    enabled: true
    
  - name: "API Availability"  
    description: "Checks if the API is responding"
    correlationId: "api-health"
    isBanner: true            # Show as banner notification
    enabled: true

# Global notification settings
settings:
  retryAttempts: 3           # Retry failed checks
  retryDelay: "30s"          # Delay between retries
  defaultTimeout: "10s"      # Default request timeout
  
# Notification channels
channels:
  webpush:
    enabled: true
    vapidSubject: "mailto:notifications@dappnode.io"
    
  webhook:
    enabled: false
    url: "https://hooks.slack.com/..."
    method: "POST"
    headers:
      Content-Type: "application/json"
```

### Dynamic Configuration
Notifications can be configured programmatically:

```typescript
// From packages/dappmanager/src/calls/notificationsUpdateEndpoints.ts
export async function notificationsUpdateEndpoints({
  dnpName,
  notificationsConfig,
  isCore
}: {
  dnpName: string;
  notificationsConfig: NotificationsConfig;
  isCore: boolean;
}): Promise<void> {
  // Update package notification configuration
  const configPath = getNotificationsConfigPath(dnpName);
  
  // Merge with existing configuration
  const existingConfig = await readNotificationsConfig(configPath);
  const mergedConfig = {
    ...existingConfig,
    ...notificationsConfig
  };
  
  // Write updated configuration
  await writeNotificationsConfig(configPath, mergedConfig);
  
  // Reload notification service
  await reloadNotificationService(dnpName);
}
```

## 🚨 Remote Notifications

### External Notification Services
DAppNode supports integration with external services:

#### Discord Integration
```typescript
// Discord webhook notifications
interface DiscordNotification {
  webhook_url: string;
  username?: string;           // Bot username
  avatar_url?: string;         // Bot avatar
  
  embeds: DiscordEmbed[];      // Rich message embeds
}

interface DiscordEmbed {
  title: string;
  description: string;
  color: number;               // Hex color code
  timestamp: string;           // ISO timestamp
  
  fields: DiscordField[];      // Additional fields
  thumbnail?: { url: string }; // Thumbnail image
  image?: { url: string };     // Full-size image
}
```

#### Telegram Integration
```typescript
// Telegram bot notifications
interface TelegramNotification {
  bot_token: string;           // Bot authentication token
  chat_id: string;             // Target chat/channel
  message: string;             // Message text
  parse_mode?: 'HTML' | 'Markdown'; // Message formatting
  
  // Rich content
  photo?: string;              // Photo URL
  document?: string;           // Document URL
  
  // Interaction
  reply_markup?: TelegramKeyboard; // Inline keyboards
}
```

#### Email Notifications
```typescript
// SMTP email notifications
interface EmailNotification {
  smtp: {
    host: string;              // SMTP server
    port: number;              // SMTP port
    secure: boolean;           // Use TLS/SSL
    auth: {
      user: string;            // Username
      pass: string;            // Password/app password
    };
  };
  
  message: {
    from: string;              // Sender address
    to: string[];              // Recipients
    subject: string;           // Email subject
    text?: string;             // Plain text body
    html?: string;             // HTML body
    attachments?: EmailAttachment[]; // File attachments
  };
}
```

### Webhook Notifications
Generic webhook support for custom integrations:

```typescript
// Webhook notification payload
interface WebhookPayload {
  event: string;               // Event type
  timestamp: number;           // Event timestamp
  source: string;              // Source package/service
  severity: 'info' | 'warning' | 'critical';
  
  // Event details
  title: string;
  message: string;
  data?: any;                  // Additional event data
  
  // DAppNode context
  dappnode: {
    id: string;                // DAppNode instance ID
    version: string;           // DAppManager version
    network: string;           // Network (mainnet, testnet, etc.)
  };
}
```

## 📱 Notification Categories

### System Notifications
Core system events and alerts:

```typescript
enum SystemNotificationType {
  SYSTEM_UPDATE = 'system_update',
  DISK_SPACE_LOW = 'disk_space_low',
  MEMORY_HIGH = 'memory_high',
  NETWORK_ISSUE = 'network_issue',
  DOCKER_ERROR = 'docker_error',
  SERVICE_RESTART = 'service_restart'
}
```

### Package Notifications
Package-specific events:

```typescript
enum PackageNotificationType {
  PACKAGE_INSTALLED = 'package_installed',
  PACKAGE_UPDATED = 'package_updated',
  PACKAGE_FAILED = 'package_failed',
  PACKAGE_STOPPED = 'package_stopped',
  PACKAGE_HEALTH_ISSUE = 'package_health_issue',
  PACKAGE_CONFIG_CHANGED = 'package_config_changed'
}
```

### Validator Notifications
Staking-specific alerts:

```typescript
enum ValidatorNotificationType {
  VALIDATOR_OFFLINE = 'validator_offline',
  MISSED_ATTESTATION = 'missed_attestation',
  BLOCK_PROPOSAL = 'block_proposal',
  SYNC_COMMITTEE = 'sync_committee',
  SLASHING_DETECTED = 'slashing_detected',
  BALANCE_CHANGE = 'balance_change',
  POOR_PERFORMANCE = 'poor_performance'
}
```

## 🎯 Notification Routing

### Smart Routing Logic
Notifications are routed based on priority and user preferences:

```typescript
// Notification routing engine
export class NotificationRouter {
  async route(notification: Notification): Promise<void> {
    const subscriptions = await this.getActiveSubscriptions();
    
    for (const subscription of subscriptions) {
      // Check if user wants this type of notification
      if (!this.shouldNotify(notification, subscription.preferences)) {
        continue;
      }
      
      // Check quiet hours
      if (this.isQuietHours(subscription.quietHours)) {
        await this.queueForLater(notification, subscription);
        continue;
      }
      
      // Check rate limiting
      if (await this.isRateLimited(subscription, notification.type)) {
        continue;
      }
      
      // Send notification
      await this.deliver(notification, subscription);
    }
  }
  
  private shouldNotify(
    notification: Notification,
    preferences: NotificationPreferences
  ): boolean {
    // Apply severity filter
    if (preferences.severityFilter !== 'all') {
      if (notification.severity !== preferences.severityFilter) {
        return false;
      }
    }
    
    // Apply package filter
    if (preferences.packageFilter.length > 0) {
      if (!preferences.packageFilter.includes(notification.package)) {
        return false;
      }
    }
    
    // Apply category preferences
    return preferences[notification.category] === true;
  }
}
```

## 🔗 Related Systems

- **[Admin UI](Admin-UI.md)**: Notification management interface
- **[PoS in DAppNode](PoS-in-DAppNode.md)**: Validator notification system
- **[Updates](Updates.md)**: Update notification system
- **[Monitoring & Metrics](Monitoring-Metrics.md)**: System health monitoring

---

> **Technical Implementation**: The notification system is implemented in `packages/notifications/` with WebPush support, Gatus integration, and comprehensive subscription management through the Admin UI.