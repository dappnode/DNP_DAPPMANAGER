import { EthicalMetricsConfig } from "@dappnode/types";
import { dbMain } from "./dbFactory.js";

const NOTIFICATIONS = "notifications";

// Deprecated
const ETHICAL_METRICS_MAIL = "ethical-metrics-mail";
const ETHICAL_METRICS_STATUS = "ethical-metrics-status";

export const notifications = dbMain.staticKey<EthicalMetricsConfig | null>(
  NOTIFICATIONS,
  null
);

// Deprecated in favor of "notifications"
export const ethicalMetricsMail = dbMain.staticKey<string | null>(
  ETHICAL_METRICS_MAIL,
  null
);

// Deprecated in favor of "notifications"
export const ethicalMetricsStatus = dbMain.staticKey<boolean>(
  ETHICAL_METRICS_STATUS,
  false
);
