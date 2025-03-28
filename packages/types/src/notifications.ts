export interface NotificationsConfig {
  endpoints?: GatusEndpoint[];
  customEndpoints?: CustomEndpoint[];
}

export interface Notification extends NotificationPayload {
  timestamp: string;
  seen: boolean;
  icon: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  dnpName: string;
  category: NotificationCategory;
  errors?: string;
  callToAction?: {
    title: string;
    url: string;
  };
}

export enum NotificationCategory {
  CORE = "CORE",
  ETHEREUM = "ETHEREUM",
  HOLESKY = "HOLESKY",
  LUKSO = "LUKSO",
  GNOSIS = "GNOSIS",
  HOODI = "HOODI",
  HOST = "HOST",
  OTHER = "OTHER"
}

export interface CustomEndpoint {
  name: string;
  enabled: boolean;
  description: string;
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

interface Alert {
  type: string;
  "failure-threshold": number;
  "success-threshold": number;
  "send-on-resolved": boolean;
  description: string;
  enabled: boolean;
}
