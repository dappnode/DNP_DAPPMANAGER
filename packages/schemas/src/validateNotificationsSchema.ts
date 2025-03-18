import { ajv } from "./ajv.js";
import { CliError } from "./error.js";
import { processError } from "./utils.js";
import notificationsSchema from "./schemas/notifications.schema.json" with { type: "json" };
import { GatusConfig } from "@dappnode/types";

/**
 * Validates notifications.yaml file with schema
 * @param config
 */
export function validateNotificationsSchema(config: GatusConfig): void {
  const validateNotifications = ajv.compile(notificationsSchema);
  const valid = validateNotifications(config);
  if (!valid) {
    const errors = validateNotifications.errors
      ? validateNotifications.errors.map((e) => processError(e, "notifications"))
      : [];
    throw new CliError(`Invalid notifications configuration: \n${errors.map((msg) => `  - ${msg}`).join("\n")}`);
  }
}
