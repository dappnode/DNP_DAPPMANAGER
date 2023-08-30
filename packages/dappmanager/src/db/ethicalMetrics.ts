import { dbMain } from "./dbFactory.js";

const ETHICAL_METRICS_MAIL = "ethical-metrics-mail";
const ETHICAL_METRICS_STATUS = "ethical-metrics-status";

export const ethicalMetricsMail = dbMain.staticKey<string | null>(
  ETHICAL_METRICS_MAIL,
  null
);

export const ethicalMetricsStatus = dbMain.staticKey<boolean>(
  ETHICAL_METRICS_STATUS,
  false
);
