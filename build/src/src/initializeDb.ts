import * as db from "./db";
import Logs from "./logs";
const logs = Logs(module);
import * as eventBus from "./eventBus";

// Modules
import * as dyndns from "./modules/dyndns";
// Utils
import getDappmanagerImage from "./utils/getDappmanagerImage";
import getServerName from "./utils/getServerName";
import getInternalIp from "./utils/getInternalIp";
import getStaticIp from "./utils/getStaticIp";
import getExternalUpnpIp from "./modules/upnpc/getExternalIp";
import getPublicIpFromUrls from "./utils/getPublicIpFromUrls";
import params from "./params";
import ping from "./utils/ping";
import { pause } from "./utils/asyncFlows";
import shell from "./utils/shell";
import { IdentityInterface } from "./types";

const vpnDataVolume = params.vpnDataVolume;
const dyndnsDomain = params.DYNDNS_DOMAIN;

// Wrap async getter so they do NOT throw, but return null and log the error
const getInternalIpSafe = returnNullIfError(getInternalIp);
const getExternalUpnpIpSafe = returnNullIfError(getExternalUpnpIp, true);
const getPublicIpFromUrlsSafe = returnNullIfError(getPublicIpFromUrls);

/**
 * - Generate local keypair for dyndns
 * - Get network status variables
 * - Trigger a dyndns loop
 */
export default async function initializeDb(): Promise<void> {
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

  if (!db.isVpnDbMigrated.get())
    try {
      const image = await getDappmanagerImage();
      const output = await shell(
        `docker run --rm -v  ${vpnDataVolume}:/data --entrypoint=/bin/cat ${image} /data/vpndb.json`
      );
      const vpndb: IdentityInterface = JSON.parse(output);
      db.dyndnsIdentity.set({
        address: vpndb.address,
        privateKey: vpndb.privateKey,
        publicKey: vpndb.publicKey
      });
      const subdomain = vpndb.address
        .toLowerCase()
        .substr(2)
        .substring(0, 16);
      const domain = [subdomain, dyndnsDomain].join(".");
      db.domain.set(domain);
      db.isVpnDbMigrated.set(true);

      logs.info("VPN identity imported.");
    } catch (e) {
      logs.warn("VPN identity not imported.");
    }

  const serverName = await getServerName();
  db.publicIp.set(publicIp || "");
  db.serverName.set(serverName);
  db.upnpAvailable.set(upnpAvailable);
  db.noNatLoopback.set(noNatLoopback);
  db.doubleNat.set(doubleNat);
  db.alertToOpenPorts.set(alertUserToOpenPorts);
  db.internalIp.set(internalIp);

  if (!db.isVpnDbMigrated.get()) {
    // Create VPN's address + publicKey + privateKey if it doesn't exist yet (with static ip or not)
    // - Verify if the privateKey is corrupted or lost. Then create a new identity and alert the user
    // - Updates the domain: db.domain.set(domain);
    dyndns.generateKeys();
  }

  eventBus.initializedDb.emit();
}

// Utils

function returnNullIfError(
  fn: () => Promise<string>,
  silent?: boolean
): () => Promise<string | null> {
  return async function(): Promise<string | null> {
    try {
      return await fn();
    } catch (e) {
      if (silent) logs.warn(e.message);
      else logs.error(e.stack || e.message);
      return null;
    }
  };
}
