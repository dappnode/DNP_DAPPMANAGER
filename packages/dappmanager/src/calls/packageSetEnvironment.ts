import { PackageEnvs } from "@dappnode/common";
import { packageSetEnvironment as _packageSetEnvironment } from "@dappnode/installer";

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
  await _packageSetEnvironment({ dnpName, environmentByService });
}
