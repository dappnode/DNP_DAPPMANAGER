import { PackageContainer } from "types";
import { EnvsVerbose } from "../types";

/**
 * @param dnp = { envs: { "ENV_NAME": "ENV_VALUE" } }
 * @return envs = {
 *   "ENV_NAME": { name: "ENV_NAME", value: "ENV_VALUE" }
 * }
 */
export default function parseInstalledDnpEnvs(
  dnp: PackageContainer
): EnvsVerbose {
  const envs = (dnp || {}).envs || {};
  return Object.entries(envs).reduce(
    (obj: EnvsVerbose, [name, value], index) => {
      obj[name] = { name, value, index };
      return obj;
    },
    {}
  );
}
