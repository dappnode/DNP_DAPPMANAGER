import { EthicalMetricsConfig } from "@dappnode/types";
import { dbMain } from "./dbFactory.js";

const ETHICAL_METRICS = "ethical-metrics";

// Deprecated
const ETHICAL_METRICS_MAIL = "ethical-metrics-mail";
const ETHICAL_METRICS_STATUS = "ethical-metrics-status";

export const ethicalMetrics = dbMain.staticKey<EthicalMetricsConfig | null>(
  ETHICAL_METRICS,
  {
    enabled: false,
    mail: null,
    tgChannelId: null,
  }
);

// Deprecated in favor of "ethical-metrics"
export const ethicalMetricsMail = dbMain.staticKey<string | null>(
  ETHICAL_METRICS_MAIL,
  null
);

// Deprecated in favor of "ethical-metrics"
export const ethicalMetricsStatus = dbMain.staticKey<boolean>(
  ETHICAL_METRICS_STATUS,
  false
);
