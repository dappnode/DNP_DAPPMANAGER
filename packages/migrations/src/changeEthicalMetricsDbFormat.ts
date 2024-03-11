import * as db from "@dappnode/db";

/**
 * Changes the format of the ethical metrics settings in the database.
 * it will change the format from:
 * ```json
 * {
 * "ethical-metrics-mail": "mail",
 * "ethical-metrics-status": "status",
 * }
 * ```
 * to:
 * ```json
 * {
 * "ethical-metrics": {
 *   "enabled": "status",
 *   "mail": "mail",
 *   "tgChannelId": "tgChannelId"
 *   }
 * }
 * ```
 */
export async function changeEthicalMetricsDbFormat(): Promise<void> {
  // Initial value is null, so if it has a value it means the migration was already done
  if (db.ethicalMetrics.get()) return;
  const mail = db.ethicalMetricsMail.get();
  const status = db.ethicalMetricsStatus.get();
  db.ethicalMetrics.set({
    enabled: status,
    mail,
    tgChannelId: null, // Important: at the time of this migration the tgChannelId was not implemented
  });
}
