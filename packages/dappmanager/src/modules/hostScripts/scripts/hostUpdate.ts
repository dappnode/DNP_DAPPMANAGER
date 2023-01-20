import memoize from "memoizee";
import { runScript } from "../runScripts.js";

export const hostUpdate = memoize(
  async function (): Promise<string> {
    return await runScript("host_update.sh");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);
