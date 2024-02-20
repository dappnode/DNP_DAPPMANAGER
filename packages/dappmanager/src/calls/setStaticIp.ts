import * as db from "@dappnode/db";
import { updateDyndnsIp } from "@dappnode/dyndns";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";

/**
 * Sets the static IP
 *
 * @param staticIp New static IP
 * - To enable: "85.84.83.82"
 * - To disable: null
 */
export async function setStaticIp({
  staticIp
}: {
  staticIp: string;
}): Promise<void> {
  const oldStaticIp = db.staticIp.get();
  db.staticIp.set(staticIp);

  // Parse action to display a feedback message
  if (!oldStaticIp && staticIp) {
    logs.info(`Enabled static IP: ${staticIp}`);
  } else if (oldStaticIp && !staticIp) {
    await updateDyndnsIp();
    const domain = db.domain.get();
    logs.info(`Disabled static IP, and registered to dyndns: ${domain}`);
  } else {
    logs.info(`Updated static IP: ${staticIp}`);
  }

  eventBus.notification.emit({
    id: "staticIpUpdated",
    type: "warning",
    title: "Update connection profiles",
    body: "Your static IP was changed, please download and install your VPN connection profile again. Instruct your users to do so also."
  });

  // Dynamic update with the new staticIp
  eventBus.requestSystemInfo.emit();
  eventBus.requestDevices.emit();
}
