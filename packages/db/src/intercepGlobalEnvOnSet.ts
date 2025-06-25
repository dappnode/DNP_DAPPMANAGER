import { logs } from "@dappnode/logger";
import { updatePkgsWithGlobalEnvs } from "./updatePkgsWithGlobalEnvs.js";
import { writeGlobalEnvsToEnvFile } from "./globalEnvs.js";
import { params } from "@dappnode/params";

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
 */
export function interceptGlobalEnvOnSet<T, U>(
  dbSetter: { get: () => T; set: (value: U) => void },
  globEnvKey: string
): {
  get: () => T;
  set: (globEnvValue: U) => Promise<void>;
} {
  return {
    ...dbSetter,

    set: async function (globEnvValue: U): Promise<void> {
      // Must be with prefix _DAPPNODE_GLOBAL_
      if (!globEnvKey.includes(params.GLOBAL_ENVS_PREFIX)) globEnvKey = `${params.GLOBAL_ENVS_PREFIX}${globEnvKey}`;

      dbSetter.set(globEnvValue);
      // Update the global env file
      writeGlobalEnvsToEnvFile();
      // List packages using the global env and update the global envs in composes files
      try {
        // Only attempt to update packages if the global env is not nullish
        if (globEnvValue !== null && globEnvValue !== undefined)
          await updatePkgsWithGlobalEnvs(globEnvKey, String(globEnvValue));
      } catch (err) {
        logs.error(`Error updating global env ${globEnvKey} to ${globEnvValue} in all dappnode packages: ${err}`);
      }
    }
  };
}
