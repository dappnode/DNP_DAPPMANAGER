import { params } from "@dappnode/params";
import { listPackageNoThrow } from "@dappnode/dockerapi";

/**
 * Returns true if HTTPS package installed and running, otherwise return false
 */
export async function isRunningHttps(): Promise<boolean> {
  const httpsPackage = await listPackageNoThrow({
    dnpName: params.HTTPS_PORTAL_DNPNAME
  });

  if (!httpsPackage) return false;

  // Check every HTTPS container is running
  httpsPackage.containers.forEach(container => {
    if (!container.running) return false;
  });

  return true;
}
