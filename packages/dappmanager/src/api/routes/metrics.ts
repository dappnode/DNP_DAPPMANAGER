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
    name: "ipfs_client_target",
    help: "Ipfs client target",
    labelNames: ["ipfsClientTarget"],
    collect() {
      const ipfsClientTarget = db.ipfsClientTarget.get();
      if (ipfsClientTarget === "local") {
        this.set({ ipfsClientTarget: "local" }, 1);
      } else {
        this.set({ ipfsClientTarget: "remote" }, 0);
      }
    }
  })
);

// Ethereum node local or remote
register.registerMetric(
  new client.Gauge({
    name: "eth_client_target",
    help: "eth client target",
    labelNames: ["ethClientTarget"],
    collect() {
      const ethClientRemote = db.ethClientRemote.get();
      if (ethClientRemote === "on") {
        this.set({ ethClientTarget: "remote" }, 0);
      } else {
        this.set({ ethClientTarget: "local" }, 1);
      }
    }
  })
);

// Ethereum fallback enabled
register.registerMetric(
  new client.Gauge({
    name: "eth_fallback",
    help: "eth fallback",
    labelNames: ["ethFallback"],
    collect() {
      const ethClientFallback = db.ethClientFallback.get();
      if (ethClientFallback === "on") {
        this.set({ ethFallback: "enabled" }, 1);
      } else {
        this.set({ ethFallback: "disabled" }, 0);
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
    name: "auto_updates",
    help: "number of auto updates enabled",
    labelNames: ["autoUpdates"],
    collect() {
      const autoUpdates = db.autoUpdateSettings.get();
      const autoUpdatesEnabled = Object.values(autoUpdates).filter(
        autoUpdate => autoUpdate.enabled === true
      ).length;
      this.set({ autoUpdates: "enabled" }, autoUpdatesEnabled);
    }
  })
);

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "dappmanager-custom-metrics"
});
