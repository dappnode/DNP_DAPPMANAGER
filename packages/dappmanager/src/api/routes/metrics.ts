import client from "prom-client";
import memoize from "memoizee";
import { wrapHandler } from "../utils.js";
import * as db from "@dappnode/db";
import { getStakerConfigByNetwork } from "../../modules/stakerConfig/index.js";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { isEmpty } from "lodash-es";
import { Network } from "@dappnode/types";
import { shellHost } from "@dappnode/utils";

/**
 * Collect the metrics:
 *   - IPFS node local or remote
 *   - Ethereum node local or remote
 *   - Which clients running on Ethereum, Gnosis, Lukso and prater
 *   - Which is the favourite connectivity method: Wifi, VPN, Wireguard, local
 *   - Auto-updates enabled
 *   - Fallback enabled
 *   - Dappnode graffiti or other
 *   - User sessions
 */
export const metrics = wrapHandler(async (req, res) => {
  // Return all metrics the Prometheus exposition format
  res.setHeader("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Create a Registry which registers the metrics
const register = new client.Registry();

// IPFS node local or remote
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_ipfs_client_target_local",
    help: "Ipfs client target local",
    labelNames: ["ipfsClientTargetLocal"],
    collect() {
      const ipfsClientTarget = db.ipfsClientTarget.get();
      if (ipfsClientTarget === "local") {
        this.set({ ipfsClientTargetLocal: "local" }, 1);
      } else {
        this.set({ ipfsClientTargetLocal: "local" }, 0);
      }
    }
  })
);

// Ethereum node local or remote
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_eth_client_target_local",
    help: "eth client target local",
    labelNames: ["ethClientTargetLocal"],
    collect() {
      const ethClientRemote = db.ethClientRemote.get();
      if (ethClientRemote === "on") {
        this.set({ ethClientTargetLocal: "local" }, 0);
      } else {
        this.set({ ethClientTargetLocal: "local" }, 1);
      }
    }
  })
);

// Ethereum fallback enabled
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_eth_fallback_enabled",
    help: "eth fallback enabled",
    labelNames: ["ethFallbackEnabled"],
    collect() {
      const ethClientFallback = db.ethClientFallback.get();
      if (ethClientFallback === "on") {
        this.set({ ethFallbackEnabled: "enabled" }, 1);
      } else {
        this.set({ ethFallbackEnabled: "enabled" }, 0);
      }
    }
  })
);

// Staker config
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_staker_config",
    help: "staker configuration",
    labelNames: ["executionClient", "consensusClient", "mevBoost"],
    async collect() {
      function parseClientToNumber(client: string): number {
        // Execution clients
        if (client.includes("besu")) return 1;
        if (client.includes("erigon")) return 2;
        if (client.includes("geth")) return 3;
        if (client.includes("nethermind")) return 4;
        // Consensus clients
        if (client.includes("lighthouse")) return 1;
        if (client.includes("nimbus")) return 2;
        if (client.includes("prysm")) return 3;
        if (client.includes("teku")) return 4;
        if (client.includes("lodestar")) return 5;

        return 0;
      }

      for (const network of [
        "mainnet",
        "prater",
        "gnosis",
        "lukso"
      ] as Network[]) {
        const { executionClient, consensusClient, isMevBoostSelected } =
          getStakerConfigByNetwork(network);

        // Execution client
        if (
          executionClient &&
          (await listPackageNoThrow({
            dnpName: executionClient
          }))
        )
          this.set(
            { executionClient: network },
            parseClientToNumber(executionClient)
          );
        else this.set({ executionClient: network }, 0);

        // Consensus client
        if (
          consensusClient &&
          (await listPackageNoThrow({
            dnpName: consensusClient
          }))
        )
          this.set(
            { consensusClient: network },
            parseClientToNumber(consensusClient)
          );
        else this.set({ consensusClient: network }, 0);

        // MEV boost
        if (isMevBoostSelected) this.set({ mevBoost: network }, 1);
        else this.set({ mevBoost: network }, 0);
      }
    }
  })
);

// Docker version
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_docker_version",
    help: "docker engine version",
    labelNames: ["dockerVersion"],
    async collect() {
      const getDockerVersionMemo = memoize(
        async () => {
          return await shellHost("docker info --format '{{.ServerVersion}}'");
        },
        {
          maxAge: 1000 * 60 * 60 * 24, // cache results for 1 day
          promise: true // Wait for Promises to resolve. Do not cache rejections
        }
      );
      const dockerVersion = await getDockerVersionMemo();
      // set docker version as a label
      this.set({ dockerVersion: dockerVersion }, 1);
    }
  })
);

// Auto-updates - system packages
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_auto_updates_system_packages",
    help: "auto updates system packages",
    labelNames: ["autoUpdatesSystemPackages"],
    collect() {
      const autoUpdates = db.autoUpdateSettings.get();
      if (!isEmpty(autoUpdates) && "system-packages" in autoUpdates) {
        const autoUpdatesSystemPackages = autoUpdates["system-packages"].enabled
          ? 1
          : 0;
        this.set(
          { autoUpdatesSystemPackages: "enabled" },
          autoUpdatesSystemPackages
        );
      } else {
        this.set({ autoUpdatesSystemPackages: "enabled" }, 0);
      }
    }
  })
);

// Auto-updates - user packages
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_auto_updates_user_packages",
    help: "auto updates user packages",
    labelNames: ["autoUpdatesUserPackages"],
    collect() {
      const autoUpdates = db.autoUpdateSettings.get();
      if (!isEmpty(autoUpdates) && "my-packages" in autoUpdates) {
        const autoUpdatesUserPackages = autoUpdates["my-packages"].enabled
          ? 1
          : 0;
        this.set(
          { autoUpdatesUserPackages: "enabled" },
          autoUpdatesUserPackages
        );
      } else {
        this.set({ autoUpdatesUserPackages: "enabled" }, 0);
      }
    }
  })
);

// Views
register.registerMetric(
  new client.Counter({
    name: "views",
    help: "number of views",
    labelNames: ["views"],
    collect() {
      const views = db.counterViews.get();
      this.reset();
      this.inc({ views: "views" }, views);
    }
  })
);

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "dappmanager-custom-metrics"
});
