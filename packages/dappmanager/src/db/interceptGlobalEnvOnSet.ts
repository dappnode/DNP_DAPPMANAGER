import { logs } from "../logs";
import {
  updatePkgsWithGlobalEnvs,
  writeGlobalEnvsToEnvFile
} from "../modules/globalEnvs";
import { DbKeys } from "./dbUtils";

/**
 * Intercept all on set methods when any global env is set. When updating a global env there must be done:
 * - Set the new value in the DB
 * - Update the .env file
 * - Update the compose file of all dappnode packages using this global env
 * - Restart all dappnode packages using this global env
 *
 * Global ENVs that must be tracked:
 * ACTIVE: string, INTERNAL_IP: string, STATIC_IP: string, HOSTNAME: string, UPNP_AVAILABLE: boolean, NO_NAT_LOOPBACK: boolean, DOMAIN: string, PUBKEY: string, ADDRESS: string, PUBLIC_IP: string, SERVER_NAME: string
 * @param dbSetter
 * @param globEnvKey The global env key to be intercepted, it is the same as the DB key value
 */
export function interceptGlobalEnvOnSet<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  F extends (...args: any[]) => any,
  T extends { set: F }
>(dbSetter: T, globEnvKey: DbKeys): T {
  return {
    ...dbSetter,

    set: function (globEnvValue: string): void {
      dbSetter.set(globEnvValue);
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
