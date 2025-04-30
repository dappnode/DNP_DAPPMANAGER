export interface NotificationsConfig {
  endpoints?: GatusEndpoint[];
  customEndpoints?: CustomEndpoint[];
}

export interface Notification extends NotificationPayload {
  id: number;
  timestamp: string;
  seen: boolean;
}

export interface NotificationPayload {
  title: string;
  body: string;
  dnpName: string;
  category: Category;
  priority: Priority;
  status: Status;
  isBanner?: boolean;
  isRemote?: boolean;
  icon?: string;
  errors?: string;
  callToAction?: {
    title: string;
    url: string;
  };
}

export enum Priority {
  low = "low",
  medium = "medium",
  high = "high",
  critical = "critical"
}

export enum Status {
  triggered = "triggered",
  resolved = "resolved"
}

export enum Category {
  system = "system",
  ethereum = "ethereum",
  holesky = "holesky",
  lukso = "lukso",
  gnosis = "gnosis",
  hoodi = "hoodi",
  hardware = "hardware",
  other = "other"
}

export interface CustomEndpoint {
  name: string;
  enabled: boolean;
  description: string;
  priority: Priority;
  metric?: {
    treshold: number;
    min: number;
    max: number;
    unit: string;
  };
}

export interface GatusEndpoint {
  name: string;
  enabled: boolean;
  url: string;
  method: string;
  conditions: string[];
  interval: string; // e.g., "1m"
  group: string;
  priority: Priority; // dappnode specific
  alerts: Alert[];
  definition: {
    // dappnode specific
    title: string;
    description: string;
  };
  metric?: {
    // dappnode specific
    min: number;
    max: number;
    unit: string; // e.g ºC
  };
}

export interface Alert {
  type: string;
  "failure-threshold": number;
  "success-threshold": number;
  "send-on-resolved": boolean;
  description: string;
  enabled: boolean;
}
