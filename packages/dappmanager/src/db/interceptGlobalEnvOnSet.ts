// GLOBAL ENVS
// ACTIVE: string, INTERNAL_IP: string, STATIC_IP: string, HOSTNAME: string, UPNP_AVAILABLE: boolean, NO_NAT_LOOPBACK: boolean, DOMAIN: string, PUBKEY: string, ADDRESS: string, PUBLIC_IP: string, SERVER_NAME: string

import { logs } from "../logs";
import {
  updatePkgsWithGlobalEnvs,
  writeGlobalEnvsToEnvFile
} from "../modules/globalEnvs";
import params from "../params";

/**
 * Intercept all on set methods when any global env is set. When updating a global env there must be done:
 * - Set the new value in the DB
 * - Update the .env file
 * - Update the compose file of all dappnode packages using this global env
 * - Restart all dappnode packages using this global env
 * @param dbSetter
 */
export function interceptGlobalEnvOnSet({
  get,
  set,
  globEnvKey
}: {
  get: () => string;
  set: (globEnvValue: string) => void;
  globEnvKey: string;
}): {
  get: () => string;
  set: (globEnvValue: string) => void;
} {
  return {
    get,

    set: function (globEnvValue: string): void {
      // Must be with prefix _DAPPNODE_GLOBAL_
      if (!globEnvKey.includes(params.GLOBAL_ENVS_PREFIX))
        globEnvKey = `${params.GLOBAL_ENVS_PREFIX}${globEnvKey}`;

      set(globEnvValue);
      // Update the global env file
      writeGlobalEnvsToEnvFile();
      // List packages using the global env and update the global envs in composes files
      updatePkgsWithGlobalEnvs(globEnvKey, globEnvValue)
        .then(() => {
          logs.info(
            `Updated global env ${globEnvKey} to ${globEnvValue} in all dappnode packages`
          );
        })
        .catch(err => {
          logs.error(
            `Error updating global env ${globEnvKey} to ${globEnvValue} in all dappnode packages: ${err}`
          );
        });
    }
  };
}
