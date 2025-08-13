import client from "prom-client";
import { wrapHandler } from "../utils.js";
import * as db from "@dappnode/db";
import { listPackageNoThrow } from "@dappnode/dockerapi";
import { isEmpty } from "lodash-es";
import { Network } from "@dappnode/types";
import { getHostInfoMemoized } from "@dappnode/hostscriptsservices";
import si from "systeminformation";
import { mevBoost, execution, consensus } from "../../index.js";

/**
 * Collect the metrics:
 *   - IPFS node local or remote
 *   - Ethereum node local or remote
 *   - Which clients running on Ethereum, Gnosis, Lukso, Prater, Holesky
 *   - Which is the favourite connectivity method: Wifi, VPN, Wireguard, local
 *   - Auto-updates enabled
 *   - Fallback enabled
 *   - Dappnode graffiti or other
 *   - User sessions
 */
export const metrics = wrapHandler(async (_, res) => {
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
        if (client.includes("reth")) return 5;
        // Consensus clients
        if (client.includes("lighthouse")) return 1;
        if (client.includes("nimbus")) return 2;
        if (client.includes("prysm")) return 3;
        if (client.includes("teku")) return 4;
        if (client.includes("lodestar")) return 5;

        return 0;
      }

      for (const network of ["mainnet", "prater", "gnosis", "lukso", "holesky", "hoodi", "sepolia"] as Network[]) {
        const isMevBoostSelected = mevBoost.DbHandlers[network].get();
        const executionClient = execution.DbHandlers[network].get();
        const consensusClient = consensus.DbHandlers[network].get();

        // Execution client
        if (
          executionClient &&
          (await listPackageNoThrow({
            dnpName: executionClient
          }))
        )
          this.set({ executionClient: network }, parseClientToNumber(executionClient));
        else this.set({ executionClient: network }, 0);

        // Consensus client
        if (
          consensusClient &&
          (await listPackageNoThrow({
            dnpName: consensusClient
          }))
        )
          this.set({ consensusClient: network }, parseClientToNumber(consensusClient));
        else this.set({ consensusClient: network }, 0);

        // MEV boost
        if (isMevBoostSelected) this.set({ mevBoost: network }, 1);
        else this.set({ mevBoost: network }, 0);
      }
    }
  })
);

// Host info metrics
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_host_info",
    help: "host info: docker, docker-cli and docker-compose versions, os, kernel, version codename and architecture",
    labelNames: [
      "dockerServerVersion",
      "dockerCliVersion",
      "dockerComposeVersion",
      "os",
      "kernel",
      "versionCodename",
      "architecture"
    ],
    async collect() {
      const hostInfo = await getHostInfoMemoized();

      this.set(
        {
          dockerServerVersion: hostInfo.dockerServerVersion,
          dockerCliVersion: hostInfo.dockerCliVersion,
          dockerComposeVersion: hostInfo.dockerComposeVersion,
          os: hostInfo.os,
          kernel: hostInfo.kernel,
          versionCodename: hostInfo.versionCodename,
          architecture: hostInfo.architecture
        },
        1
      );
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
        const autoUpdatesSystemPackages = autoUpdates["system-packages"].enabled ? 1 : 0;
        this.set({ autoUpdatesSystemPackages: "enabled" }, autoUpdatesSystemPackages);
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
        const autoUpdatesUserPackages = autoUpdates["my-packages"].enabled ? 1 : 0;
        this.set({ autoUpdatesUserPackages: "enabled" }, autoUpdatesUserPackages);
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

// Add cpu temperature metric
register.registerMetric(
  new client.Gauge({
    name: "dappmanager_cpu_temperature_celsius",
    help: "CPU temperature metrics, including current and maximum safe operating temperatures in Celsius degrees",
    labelNames: ["type"], // 'type' label to distinguish between 'current' and 'max'
    async collect() {
      const cpuTemperature = await si.cpuTemperature();
      const { main, max } = cpuTemperature;

      // Set the current CPU temperature
      if (main) this.labels("current").set(main);

      // Optionally set the maximum safe operating temperature
      // Note: This value is typically static and does not change over time,
      // so it might be more efficient to document this elsewhere unless it's important for it to be queryable in Prometheus.
      if (max) this.labels("max").set(max);
    }
  })
);

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "dappmanager-custom-metrics"
});
