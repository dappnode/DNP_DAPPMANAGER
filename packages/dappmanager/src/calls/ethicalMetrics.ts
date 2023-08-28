import { EthicalMetricsConfig } from "@dappnode/common";
import { eventBus } from "../eventBus.js";
import { listPackageNoThrow } from "../modules/docker/list/listPackages.js";
import { packageRestart } from "./packageRestart.js";
import { packageStartStop } from "./packageStartStop.js";

export async function enableEthicalMetrics({
  email
}: {
  email: string;
}): Promise<void> {
  if (!email) throw Error("email must exist");

  const ethicalMetricsPkg = await listPackageNoThrow({
    dnpName: "ethical-metrics.dnp.dappnode.eth"
  });

  if (!ethicalMetricsPkg) eventBus.runEthicalMetricsInstaller.emit({ email });
  else {
    // Make sure pkg is installed and running
    if (ethicalMetricsPkg.containers.some(c => c.state !== "running"))
      await packageRestart({ dnpName: ethicalMetricsPkg.dnpName });
  }
}

export async function disableEthicalMetrics(): Promise<void> {
  // unregister
  await unregisterEthicalMetrics();
  // stop the service
  await packageStartStop({ dnpName: "ethical-metrics.dnp.dappnode.eth" });
}

export async function getEthicalMetricsConfig(): Promise<EthicalMetricsConfig> {
  return {
    isRunning: false,
    isRegistered: false,
    instance: "",
    email: ""
  };
}

export async function registerEthicalMetrics({
  email
}: {
  email: string;
}): Promise<void> {
  if (!email) throw Error("email must exist");
  // call register endpoint
}

export async function unregisterEthicalMetrics(): Promise<void> {
  // TODO
}
