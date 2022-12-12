import client from "prom-client";
import { wrapHandler } from "../utils";
import * as db from "../../db";
import { stakerParamsByNetwork } from "../../modules/stakerConfig/stakerParamsByNetwork";
import { Network } from "../../types";
import { listPackageNoThrow } from "../../modules/docker/list";

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
    name: "ipfs_node_local_or_remote",
    help: "Ipfs node local or remote",
    labelNames: ["ipfsNodeLocal", "ipfsNodeRemote"],
    collect() {
      const ipfsClientTarget = db.ipfsClientTarget.get();
      if (ipfsClientTarget === "local") {
        this.set({ ipfsNodeLocal: "true" }, 1);
        this.set({ ipfsNodeRemote: "false" }, 0);
      } else {
        this.set({ ipfsNodeLocal: "false" }, 0);
        this.set({ ipfsNodeRemote: "true" }, 1);
      }
    }
  })
);

// Ethereum node local or remote
register.registerMetric(
  new client.Gauge({
    name: "eth_node_local_or_remote",
    help: "eth node local or remote",
    labelNames: ["ethNodeLocal", "ethNodeRemote"],
    collect() {
      const ethClientRemote = db.ethClientRemote.get();
      if (ethClientRemote === "on") {
        this.set({ ethNodeLocal: "false" }, 0);
        this.set({ ethNodeRemote: "true" }, 1);
      } else {
        this.set({ ethNodeLocal: "true" }, 1);
        this.set({ ethNodeRemote: "false" }, 0);
      }
    }
  })
);

// Ethereum fallback enabled
register.registerMetric(
  new client.Gauge({
    name: "eth_fallback_enabled_or_disabled",
    help: "eth fallback enabled or disabled",
    labelNames: ["ethFallbackEnabled", "ethFallbackDisabled"],
    collect() {
      const ethClientFallback = db.ethClientFallback.get();
      if (ethClientFallback === "on") {
        this.set({ ethFallbackEnabled: "true" }, 1);
        this.set({ ethFallbackDisabled: "false" }, 0);
      } else {
        this.set({ ethFallbackEnabled: "false" }, 0);
        this.set({ ethFallbackDisabled: "true" }, 1);
      }
    }
  })
);

// Staker config
register.registerMetric(
  new client.Gauge({
    name: "staker_config",
    help: "staker configuration",
    labelNames: [
      "executionClientMainnet",
      "consensusClientMainnet",
      "mevBoostMainnet",
      "executionClientPrater",
      "consensusClientPrater",
      "mevBoostPrater",
      "executionClientGnosis",
      "consensusClientGnosis",
      "mevBoostGnosis"
    ],
    async collect() {
      for (const network of ["mainnet", "prater", "gnosis"] as Network[]) {
        const stakerConfig = stakerParamsByNetwork(network);
        const executionLabel = `executionClient${network[0].toUpperCase()}${network.slice(
          1
        )}`;
        const consensusLabel = `consensusClient${network[0].toUpperCase()}${network.slice(
          1
        )}`;
        const mevBoostLabel = `mevBoost${network[0].toUpperCase()}${network.slice(
          1
        )}`;

        // Execution client
        if (
          stakerConfig.currentExecClient &&
          (await listPackageNoThrow({
            dnpName: stakerConfig.currentExecClient
          }))
        )
          this.set({ [executionLabel]: stakerConfig.currentExecClient }, 1);
        else this.set({ [executionLabel]: stakerConfig.currentExecClient }, 0);

        // Consensus client
        if (
          stakerConfig.currentConsClient &&
          (await listPackageNoThrow({
            dnpName: stakerConfig.currentConsClient
          }))
        )
          this.set({ [consensusLabel]: stakerConfig.currentConsClient }, 1);
        else this.set({ [consensusLabel]: stakerConfig.currentConsClient }, 0);

        // MEV boost
        if (
          stakerConfig.isMevBoostSelected &&
          (await listPackageNoThrow({ dnpName: stakerConfig.mevBoost }))
        )
          this.set({ [mevBoostLabel]: stakerConfig.mevBoost }, 1);
        else this.set({ [mevBoostLabel]: stakerConfig.mevBoost }, 0);
      }
    }
  })
);

// Auto-updates
register.registerMetric(
  new client.Gauge({
    name: "number_of_auto_updates_enabled_or_disabled",
    help: "number of auto updates enabled or disabled",
    labelNames: ["autoUpdatesEnabled", "autoUpdatesDisabled"],
    collect() {
      const autoUpdates = db.autoUpdateSettings.get();
      const autoUpdatesEnabled = Object.values(autoUpdates).filter(
        autoUpdate => autoUpdate.enabled === true
      ).length;
      const autoUpdatesDisabled = Object.values(autoUpdates).filter(
        autoUpdate => autoUpdate.enabled === false
      ).length;
      this.set({ autoUpdatesEnabled: "enabled" }, autoUpdatesEnabled);
      this.set({ autoUpdatesDisabled: "disabled" }, autoUpdatesDisabled);
    }
  })
);

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "dappmanager-custom-metrics"
});
