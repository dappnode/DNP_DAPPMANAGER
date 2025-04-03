import * as db from "@dappnode/db";
import { updateDyndnsIp } from "@dappnode/dyndns";
import { eventBus } from "@dappnode/eventbus";
import { logs } from "@dappnode/logger";
import { notifications } from "@dappnode/notifications";
import { params } from "@dappnode/params";
import { NotificationCategory } from "@dappnode/types";

/**
 * Sets the static IP
 *
 * @param staticIp New static IP
 * - To enable: "85.84.83.82"
 * - To disable: null
 */
export async function setStaticIp({ staticIp }: { staticIp: string }): Promise<void> {
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

  await notifications
    .sendNotification({
      title: "Static IP updated",
      body: `Your static IP was changed to ${staticIp}.`,
      dnpName: params.dappmanagerDnpName,
      category: NotificationCategory.core
    })
    .catch((e) => logs.error("Error sending static IP updated notification", e));

  // Dynamic update with the new staticIp
  eventBus.requestSystemInfo.emit();
  eventBus.requestDevices.emit();
}
