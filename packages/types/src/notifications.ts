export interface Notification {
  title: string;
  body: string;
  dnpName: string;
  timestamp: string;
  category: string;
  seen: boolean;
  callToAction?: {
    title: string;
    url: string;
  };
}

export interface GatusConfig {
  endpoints: Endpoint[];
}

export interface Endpoint {
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
