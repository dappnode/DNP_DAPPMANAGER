import { dbMain } from "./dbFactory.js";

const ETHICAL_METRICS_ENABLED = "ethical-metrics-enabled";
const ETHICAL_METRICS_EMAIL = "ethical-metrics-email";

export const ethicalMetricsEnabled = dbMain.staticKey<boolean | null>(
  ETHICAL_METRICS_ENABLED,
  null
);

export const ethicalMetricsEmail = dbMain.staticKey<string | null>(
  ETHICAL_METRICS_EMAIL,
  null
);
