import memoizee from "memoizee";
import { ExposableServiceInfo, InstalledPackageData } from "@dappnode/types";
import { listPackages } from "@dappnode/dockerapi";
import { readManifestIfExists } from "@dappnode/utils";
import { exposablePredefined } from "./predefined.js";
import { parseExposableServiceManifest } from "./parseExposable.js";

/**
 * Cache results for 1 hour, 50 max by dnpName + version. Prevent reading from disk too often
 */
const getExposableServicesByDnpMemo = memoizee(
  function getExposableServicesByDnp(dnp: InstalledPackageData): ExposableServiceInfo[] | null {
    // Read disk
    const manifest = readManifestIfExists(dnp.dnpName);
    return manifest?.exposable ? parseExposableServiceManifest(dnp, manifest.exposable) : null;
  },
  {
    max: 50,
    maxAge: 60 * 60 * 1000,
    normalizer: ([dnp]) => dnp.dnpName + dnp.version
  }
);

export async function getExposableServices(): Promise<ExposableServiceInfo[]> {
  const dnps = await listPackages();

  const exposable: ExposableServiceInfo[] = [];

  for (const dnp of dnps) {
    const exposableByDnpArr = getExposableServicesByDnpMemo(dnp) || exposablePredefined[dnp.dnpName] || [];
    for (const item of exposableByDnpArr) exposable.push(item);
  }

  return exposable;
}
