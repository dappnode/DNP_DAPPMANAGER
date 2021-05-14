import memoize from "memoizee";
import { runScript } from "../runScripts";

export const securityUpdate = memoize(
  async function(): Promise<string> {
    return await runScript("security_update.sh");
  },
  // Prevent running this script more than once
  { promise: true, maxAge: 2000 }
);
