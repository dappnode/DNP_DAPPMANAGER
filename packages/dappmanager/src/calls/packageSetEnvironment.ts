import { packageSetEnvironment as pkgSetEnvironment } from "@dappnode/installer";
import { PackageEnvs } from "@dappnode/common";

/**
 * Updates the .env file of a package. If requested, also re-ups it
 */
export async function packageSetEnvironment({
  dnpName,
  environmentByService
}: {
  dnpName: string;
  environmentByService: { [serviceName: string]: PackageEnvs };
}): Promise<void> {
  await pkgSetEnvironment({ dnpName, environmentByService });
}
