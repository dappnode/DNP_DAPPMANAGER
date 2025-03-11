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
  description: string; // dappnode specific
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
}
