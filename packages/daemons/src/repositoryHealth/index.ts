import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import * as db from "@dappnode/db";
import { getEthUrl, getIpfsUrl } from "@dappnode/installer";
import { params } from "@dappnode/params";

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const IPFS_NOTIFICATION_TITLE = "IPFS Endpoint Health Check";
const ETH_NOTIFICATION_TITLE = "Ethereum Endpoint Health Check";

let ipfsNotificationSent = false;
let ethNotificationSent = false;

async function checkIpfsHealth(): Promise<void> {
  const ipfsClientTarget = db.ipfsClientTarget.get();
  const ipfsUrl = getIpfsUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${ipfsUrl}/api/v0/version`, {
      method: "GET",
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Status ${res.status}`);

    logs.info(`IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is healthy`);

    if (ipfsNotificationSent) {
      await notifications.sendNotification({
        title: IPFS_NOTIFICATION_TITLE,
        dnpName: params.dappmanagerDnpName,
        body: `**IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is now healthy.**`,
        category: Category.system,
        priority: Priority.low,
        status: Status.resolved
      });
      ipfsNotificationSent = false;
    }
  } catch (error) {
    clearTimeout(timeout);
    logs.error(`IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is unhealthy: ${error}`);

    if (!ipfsNotificationSent) {
      await notifications.sendNotification({
        title: IPFS_NOTIFICATION_TITLE,
        dnpName: params.dappmanagerDnpName,
        body: `**IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is not working.** Click **Change** to switch the IPFS repository.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: `Navigate to ${ipfsClientTarget}`,
          url: "http://my.dappnode/repository/ipfs"
        }
      });
      ipfsNotificationSent = true;
    }
  }
}

async function checkEthHealth(): Promise<void> {
  const ethClientTarget = db.ethClientRemote.get();
  const ethUrl = await getEthUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(ethUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "web3_clientVersion",
        params: [],
        id: 1
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (!data.result) throw new Error(`Invalid response: ${JSON.stringify(data)}`);

    logs.info(`Ethereum endpoint (${ethClientTarget}) at ${ethUrl} is healthy`);

    if (ethNotificationSent) {
      await notifications.sendNotification({
        title: ETH_NOTIFICATION_TITLE,
        dnpName: params.dappmanagerDnpName,
        body: `**Ethereum endpoint (${ethClientTarget}) at ${ethUrl} is now healthy.**`,
        category: Category.system,
        priority: Priority.low,
        status: Status.resolved
      });
      ethNotificationSent = false;
    }
  } catch (error) {
    clearTimeout(timeout);
    logs.error(`Ethereum endpoint (${ethClientTarget}) at ${ethUrl} is unhealthy: ${error}`);

    if (!ethNotificationSent) {
      await notifications.sendNotification({
        title: ETH_NOTIFICATION_TITLE,
        dnpName: params.dappmanagerDnpName,
        body: `**Ethereum endpoint (${ethClientTarget}) at ${ethUrl} is not working.** Click **Change** to switch the Ethereum repository.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: `Navigate to ${ethClientTarget}`,
          url: "http://my.dappnode/repository/ethereum"
        }
      });
      ethNotificationSent = true;
    }
  }
}

export function startRepositoryHealthDaemon(signal: AbortSignal): void {
  runAtMostEvery(() => checkIpfsHealth(), CHECK_INTERVAL, signal);
  runAtMostEvery(() => checkEthHealth(), CHECK_INTERVAL, signal);
}
