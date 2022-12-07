import { logs } from "../logs";
import {
  updatePkgsWithGlobalEnvs,
  writeGlobalEnvsToEnvFile
} from "../modules/globalEnvs";
import params from "../params";
import * as db from "../db";
import { DbValues } from "./dbUtils";

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
>(dbSetter: T, globEnvKey: DbValues): T {
  return {
    ...dbSetter,

    set: function (globEnvValue: string): void {
      logs.info(`The globEnvKey is ${globEnvKey}`);
      // In the globEnvKey change the capital letter to lowercase and change the "_" to "-"
      const globEnvKeyDnp = globEnvKey
        .replace(params.GLOBAL_ENVS_PREFIX, "")
        .toLowerCase()
        .replace("_", "");
      logs.info(`The globEnvKeyDnp is ${globEnvKeyDnp}`);
      logs.info(`The db is ${JSON.stringify(db)}`);
      if (globEnvKeyDnp in db) {
        // access the value of db.globEnvKey
        const a = db[globEnvKey as keyof typeof db];
        logs.info(`The value of db.${globEnvKey} is ${a}`);
      }

      // Must be with prefix _DAPPNODE_GLOBAL_
      if (!globEnvKey.includes(params.GLOBAL_ENVS_PREFIX))
        globEnvKey = `${params.GLOBAL_ENVS_PREFIX}${globEnvKey}`;

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
