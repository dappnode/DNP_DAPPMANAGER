import client from "prom-client";
import { wrapHandler } from "../utils";
import * as db from "../../db";
import { stakerParamsByNetwork } from "../../modules/stakerConfig/stakerParamsByNetwork";
import { Network } from "@dappnode/common";
import { listPackageNoThrow } from "../../modules/docker/list";
import { isEmpty } from "lodash-es";

/**
 * Collect the metrics:
 *   - IPFS node local or remote
 *   - Ethereum node local or remote
 *   - Which clients running on Ethereum, Gnosis, and prater
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

        return 0;
      }

      for (const network of ["mainnet", "prater", "gnosis"] as Network[]) {
        const stakerConfig = stakerParamsByNetwork(network);

        // Execution client
        if (
          stakerConfig.currentExecClient &&
          (await listPackageNoThrow({
            dnpName: stakerConfig.currentExecClient
          }))
        )
          this.set(
            { executionClient: network },
            parseClientToNumber(stakerConfig.currentExecClient)
          );
        else this.set({ executionClient: network }, 0);

        // Consensus client
        if (
          stakerConfig.currentConsClient &&
          (await listPackageNoThrow({
            dnpName: stakerConfig.currentConsClient
          }))
        )
          this.set(
            { consensusClient: network },
            parseClientToNumber(stakerConfig.currentConsClient)
          );
        else this.set({ consensusClient: network }, 0);

        // MEV boost
        if (
          stakerConfig.isMevBoostSelected &&
          (await listPackageNoThrow({ dnpName: stakerConfig.mevBoost }))
        )
          this.set({ mevBoost: network }, 1);
        else this.set({ mevBoost: network }, 0);
      }
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
