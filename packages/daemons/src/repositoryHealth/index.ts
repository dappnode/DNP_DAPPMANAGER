import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import * as db from "@dappnode/db";
import { getEthUrl, getIpfsUrl } from "@dappnode/installer";
import { params } from "@dappnode/params";

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

let ipfsNotificationSent = false;
let ethNotificationSent = false;

async function checkIpfsHealth(): Promise<void> {
  const ipfsClientTarget = db.ipfsClientTarget.get();
  const ipfsUrl = getIpfsUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const correlationId = "core-ipfs-check";

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
        title: "Your Dappnode IPFS endpoint is resolving content correctly",
        dnpName: params.dappmanagerDnpName,
        body: `Access to decentralized content has been restored and is functioning as expected.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.resolved,
        isBanner: false,
        isRemote: false,
        correlationId
      });
      ipfsNotificationSent = false;
    }
  } catch (error) {
    clearTimeout(timeout);
    logs.error(`IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is unhealthy: ${error}`);

    if (!ipfsNotificationSent) {
      await notifications.sendNotification({
        title: "Your Dappnode IPFS endpoint is not resolving content correctly.",
        dnpName: params.dappmanagerDnpName,
        body: `Dappnode IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is currently unreachable or not resolving content correctly. This may affect access to decentralized content or applications relying on IPFS.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: `Switch to ${ipfsClientTarget && ipfsClientTarget === "local" ? "Remote" : "Local"} IPFS`,
          url: "http://my.dappnode/repository/ipfs"
        },
        isBanner: true,
        isRemote: false,
        correlationId
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

  const correlationId = "core-eth-check";

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
        title: "Ethereum Repository Accessible",
        dnpName: params.dappmanagerDnpName,
        body: `Your DAppNode has successfully reconnected to the Ethereum repository.
Syncing and access to Ethereum chain data should now resume normally.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.resolved,
        isBanner: false,
        isRemote: false,
        correlationId
      });
      ethNotificationSent = false;
    }
  } catch (error) {
    clearTimeout(timeout);
    logs.error(`Ethereum endpoint (${ethClientTarget}) at ${ethUrl} is unhealthy: ${error}`);

    if (!ethNotificationSent) {
      await notifications.sendNotification({
        title: "Ethereum Repository Unreachable",
        dnpName: params.dappmanagerDnpName,
        body: `Your Dappnode is currently unable to connect to the Ethereum endpoint (${ethClientTarget}) at ${ethUrl}`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: (ethClientTarget && ethClientTarget  === "off")  ? "Change to Remote" :  "Make sure your Ethereum RPC is reachable",
          url: "http://my.dappnode/repository/ethereum"
        },
        isBanner: true,
        isRemote: false,
        correlationId
      });
      ethNotificationSent = true;
    }
  }
}

export function startRepositoryHealthDaemon(signal: AbortSignal): void {
  runAtMostEvery(() => checkIpfsHealth(), CHECK_INTERVAL, signal);
  runAtMostEvery(() => checkEthHealth(), CHECK_INTERVAL, signal);
}
