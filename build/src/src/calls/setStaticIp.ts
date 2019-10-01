import { RpcHandlerReturn } from "../types";
import * as db from "../db";
import * as dyndns from "../modules/dyndns";

/**
 * Sets the static IP
 *
 * @param {(string|null)} staticIp New static IP
 * - To enable: "85.84.83.82"
 * - To disable: null
 */
export default async function setStaticIp({
  staticIp
}: {
  staticIp: string;
}): Promise<RpcHandlerReturn> {
  const oldStaticIp = db.staticIp.get();
  db.staticIp.set(staticIp);

  // Parse action to display a feedback message
  let message;
  if (!oldStaticIp && staticIp) {
    message = `Enabled static IP: ${staticIp}`;
  } else if (oldStaticIp && !staticIp) {
    await dyndns.updateIp();
    const domain = db.domain.get();
    message = `Disabled static IP, and registered to dyndns: ${domain}`;
  } else {
    message = `Updated static IP: ${staticIp}`;
  }

  return {
    message,
    logMessage: true,
    userAction: true
  };
}

module.exports = setStaticIp;
