import memoize from "memoizee";
import { runScript } from "../runScripts.js";
import { RebootRequiredScript } from "@dappnode/types";

/**
 * Checks weather or not the host machine needs to be rebooted
 * if it does, it returns the list of packages that need to be updated
 */
export const getRebootRequiredMemoized = memoize(
  async function (): Promise<RebootRequiredScript> {
    const response = await runScript("reboot_required.sh");
    const infoParsed = JSON.parse(response);
    return {
      rebootRequired: infoParsed.rebootRequired,
      pkgs: infoParsed.pkgs
    };
  },
  {
    promise: true,
    maxAge: 60 * 1000 * 5 // 5 minutes
  }
);
