import * as db from "./db";
import Logs from "./logs";
const logs = Logs(module);

// Modules
import * as dyndns from "./modules/dyndns";
// Utils
import getServerName from "./utils/getServerName";
import getInternalIp from "./utils/getInternalIp";
import getStaticIp from "./utils/getStaticIp";
import getExternalUpnpIp from "./modules/upnpc/getExternalIp";
import getPublicIpFromUrls from "./utils/getPublicIpFromUrls";
import ping from "./utils/ping";
import { pause } from "./utils/asyncFlows";

// Wrap async getter so they do NOT throw, but return null and log the error
const getInternalIpSafe = returnNullIfError(getInternalIp);
const getExternalUpnpIpSafe = returnNullIfError(getExternalUpnpIp);
const getPublicIpFromUrlsSafe = returnNullIfError(getPublicIpFromUrls);

export default async function initializeApp(): Promise<void> {
  // 1. Directly connected to the internet: Public IP is the interface IP
  // 2. Behind a router: Needs to get the public IP, open ports and get the internal IP
  // 2A. UPnP available: Get public IP without a centralize service. Can open ports
  // 2B. No UPnP: Open ports manually, needs a centralized service to get the public IP
  // 2C. No NAT-Loopback: Public IP can't be resolved within the same network. User needs 2 profiles

  // Check if the static IP is set. If so, don't use any centralized IP-related service
  // The publicIp will be obtained in the entrypoint.sh and exported as PUBLIC_IP
  const staticIp = await getStaticIp(); // Does not throw
  let internalIp: string | null = null;
  while (!internalIp) {
    internalIp = await getInternalIpSafe();
    if (!internalIp) {
      logs.warn("Internal IP is not available yet, retrying in 60 seconds");
      await pause(60 * 1000);
    }
  }
  // > External IP
  //   If the host is exposed to the internet and the staticIp is set, avoid calling UPnP.
  //   Otherwise, get the externalIp from UPnP
  const externalIp: string | null =
    staticIp && staticIp === internalIp
      ? staticIp
      : await getExternalUpnpIpSafe();

  // > Public IP
  //   `getPublicIpFromUrls` is a call to a centralized service.
  //   If the staticIp or the externalIp (from UPnP) is set, avoid calling getPublicIpFromUrls
  const publicIp = staticIp || (await getPublicIpFromUrlsSafe());

  // > UPnP Available
  //   This boolean will trigger the VPN nodejs process to try to open the ports with UPnP
  //   UPnP is available and necessary only if the internalIp is not equal to the public IP
  //   and the external IP from UPnP command succeeded
  const upnpAvailable = publicIp
    ? Boolean(externalIp && internalIp !== publicIp)
    : false;

  // >
  const doubleNat = publicIp
    ? Boolean(externalIp && externalIp !== publicIp)
    : false;

  // > No NAT Loopback
  //   This boolean will trigger a warning in the ADMIN UI to alert the user to use different VPN profiles
  //   If the DAppNode is not able to resolve it's own public IP, the user should use the internal IP
  //   to connect from the same network as the DAppNode
  //   * The ping command is really slow, only execute it if necessary
  //   * Ping does not throw
  const noNatLoopback = publicIp
    ? Boolean(internalIp !== publicIp ? !(await ping(publicIp)) : false)
    : false;

  // > Alert user to open ports
  //   This boolean will trigger a warning in the ADMIN UI to alert the user to open ports
  //   Will be true if the DAppNode is behind a router but the external IP from UPnP command failed
  const alertUserToOpenPorts = publicIp
    ? Boolean(internalIp !== publicIp && !upnpAvailable)
    : false;

  const serverName = await getServerName();
  db.publicIp.set(publicIp || "");
  db.serverName.set(serverName);
  db.upnpAvailable.set(upnpAvailable);
  // FIXME: Change naming of noNatLoopback to remove negation.
  db.noNatLoopback.set(noNatLoopback);
  // FIXME: Add logic to detect double NAT (External UPnP IP != Public IP)
  db.doubleNat.set(doubleNat);
  db.alertToOpenPorts.set(alertUserToOpenPorts);
  db.internalIp.set(internalIp);

  // Create VPN's address + publicKey + privateKey if it doesn't exist yet (with static ip or not)
  // - Verify if the privateKey is corrupted or lost. Then create a new identity and alert the user
  // - Updates the domain: db.domain.set(domain);
  await dyndns.generateKeys();
}

// Utils

function returnNullIfError(
  fn: () => Promise<string>
): () => Promise<string | null> {
  return async function(): Promise<string | null> {
    try {
      return await fn();
    } catch (e) {
      logs.error(e.stack || e.message);
      return null;
    }
  };
}
