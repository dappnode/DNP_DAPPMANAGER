import { PackageEnvs } from "@dappnode/types";
import { packageSetEnvironment as _packageSetEnvironment } from "@dappnode/installer";
import { packageRestartVolumes } from "./packageRestartVolumes.js";
import { logs } from "@dappnode/logger";
import { params } from "@dappnode/params";

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

  if (dnpName === params.TAILSCALE_DNP_NAME) {
    logs.info("Restarting Tailscale volumes");
    await packageRestartVolumes({
      dnpName
    });
  }
}
