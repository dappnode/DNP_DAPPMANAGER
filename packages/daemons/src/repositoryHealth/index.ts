import { logs } from "@dappnode/logger";
import { runAtMostEvery } from "@dappnode/utils";
import { notifications } from "@dappnode/notifications";
import { Category, Priority, Status } from "@dappnode/types";
import * as db from "@dappnode/db";
import { getIpfsUrl } from "@dappnode/installer";
import { params } from "@dappnode/params";
import { eventBus } from "@dappnode/eventbus";

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes

let ipfsFailureCount = 0;
let ipfsNotificationSent = false;
let ethFailureCount = 0;
let ethNotificationSent = false;

async function checkIpfsHealth(): Promise<void> {
  const ipfsClientTarget = db.ipfsClientTarget.get();
  const ipfsUrl = getIpfsUrl();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const correlationId = "core-ipfs-check";

  try {
    // check health by fetching CID of empty directory QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn. Most of ipfs nodes should have it.
    // checked against: https://ipfs.io https://gateway-dev.ipfs.dappnode.io https://gateway.ipfs.dappnode.io
    const res = await fetch(`${ipfsUrl}/ipfs/QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Status ${res.status}`);

    logs.info(`IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is healthy`);

    // reset failure count on success
    ipfsFailureCount = 0;
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

    // increment failure count and send notification after threshold
    ipfsFailureCount += 1;
    if (ipfsFailureCount >= 3 && !ipfsNotificationSent) {
      await notifications.sendNotification({
        title: "Your Dappnode IPFS endpoint is not resolving content correctly.",
        dnpName: params.dappmanagerDnpName,
        body: `Dappnode IPFS endpoint (${ipfsClientTarget}) at ${ipfsUrl} is currently unreachable or not resolving content correctly. This may affect access to decentralized content or applications relying on IPFS.`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: `Switch to ${ipfsClientTarget && ipfsClientTarget === "local" ? "Remote" : "Local"} IPFS`,
          url: "http://my.dappnode/system/ipfs"
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
  const ethUrl = params.ETH_MAINNET_RPC_URL_REMOTE;

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

    logs.info(`Ethereum endpoint ${ethUrl} is healthy`);

    // reset failure count on success
    ethFailureCount = 0;
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
    logs.error(`Ethereum endpoint ${ethUrl} is unhealthy: ${error}`);

    // increment failure count and send notification after threshold
    ethFailureCount += 1;
    if (ethFailureCount >= 3 && !ethNotificationSent) {
      await notifications.sendNotification({
        title: "Ethereum Repository Unreachable",
        dnpName: params.dappmanagerDnpName,
        body: `Your Dappnode is currently unable to connect to the Ethereum endpoint ${ethUrl}`,
        category: Category.system,
        priority: Priority.high,
        status: Status.triggered,
        callToAction: {
          title: "Check docs",
          url: "https://docs.dappnode.io/docs/user/repository/ethereum"
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
  // Immediate health checks when repository targets change
  eventBus.ipfsRepositoryChanged.on(() => {
    checkIpfsHealth().catch((error) => logs.error("Error on IPFS health check after repository change", error));
  });
  eventBus.ethRepositoryChanged.on(() => {
    checkEthHealth().catch((error) => logs.error("Error on Ethereum health check after repository change", error));
  });
}
