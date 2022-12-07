import client from "prom-client";
import { wrapHandler } from "../utils";
import * as db from "../../db";

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
  // Create a Registry which registers the metrics
  const register = new client.Registry();

  // IPFS node local or remote
  register.registerMetric(
    new client.Gauge({
      name: "ipfs_node_local_or_remote",
      help: "Ipfs node local or remote",
      labelNames: ["ipfsNodeLocalOrRemote"],
      collect() {
        const currentValue = db.ipfsClientTarget.get();
        this.set({ ipfsNodeLocalOrRemote: currentValue }, 1);
      }
    })
  );

  // Ethereum node local or remote
  register.registerMetric(
    new client.Gauge({
      name: "eth_node_local_or_remote",
      help: "eth node local or remote",
      labelNames: ["ethNodeLocalOrRemote"],
      collect() {
        const currentValue = db.ipfsClientTarget.get();
        this.set({ ethNodeLocalOrRemote: currentValue }, 1);
      }
    })
  );

  // Add a default label which is added to all metrics
  register.setDefaultLabels({
    app: "dappmanager-custom-metrics"
  });

  // Enable the collection of default metrics
  client.collectDefaultMetrics({ register });

  // Return all metrics the Prometheus exposition format
  res.setHeader("Content-Type", register.contentType);
  res.end(register.metrics());
});
