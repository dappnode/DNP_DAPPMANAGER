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

// UI activity staleness threshold (if no heartbeat received in this time, consider user inactive)
// Should be > heartbeat interval (30s) to account for network delays
const UI_ACTIVITY_STALE_THRESHOLD_SECONDS = 90; // 1.5 minutes

// Helper to check if UI activity is stale
function isUiActivityStale(lastActivityTimestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now - lastActivityTimestamp > UI_ACTIVITY_STALE_THRESHOLD_SECONDS;
}

// UI user active metric
register.registerMetric(
  new client.Gauge({
    name: "ui_user_active",
    help: "Whether a user is currently active in the UI (1 = active, 0 = inactive)",
    collect() {
      const uiActivityData = db.uiActivity.get();
      // Consider inactive if no heartbeat received recently (handles browser close)
      const isActive = uiActivityData.isActive && !isUiActivityStale(uiActivityData.lastActivityTimestamp);
      this.set(isActive ? 1 : 0);
    }
  })
);

// UI last activity timestamp metric
register.registerMetric(
  new client.Gauge({
    name: "ui_last_activity_timestamp_seconds",
    help: "Unix timestamp of the last user activity in the UI (seconds)",
    collect() {
      const uiActivityData = db.uiActivity.get();
      this.set(uiActivityData.lastActivityTimestamp);
    }
  })
);

// UI session uptime metric
register.registerMetric(
  new client.Gauge({
    name: "ui_session_uptime_seconds",
    help: "Duration of the current UI session in seconds (0 if no active session)",
    collect() {
      const uiActivityData = db.uiActivity.get();
      // Only report uptime if session is active and not stale
      const isActive = uiActivityData.isActive && !isUiActivityStale(uiActivityData.lastActivityTimestamp);
      if (uiActivityData.sessionStartTimestamp > 0 && isActive) {
        const now = Math.floor(Date.now() / 1000);
        this.set(now - uiActivityData.sessionStartTimestamp);
      } else {
        this.set(0);
      }
    }
  })
);

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "dappmanager-custom-metrics"
});
