import { safeSemver } from "../utils/safeSemver.js";
import { hasVersion, getDependencies, toReq } from "../utils/dnpUtils.js";
import { StateInternalInterface, DappGetDnps } from "../types.js";

/**
 * Checks if a specific combination of DNP versions is valid
 * It invalidates the state at the first incompatibility found
 *
 * @param state Combination of DNP versions
 * {A: '2.0.0, B: '1.1.0', C: '1.0.0'}
 * @param dnps The entire dnps, displaying all DNP versions and their deps
  * repo = {
    "A": {
        "1.0.0": {"C": "^1.0.0"},
        "2.0.0": {"C": "^2.0.0", "D": "^1.0.0"},
        "2.1.0": {"C": "^2.0.0", "D": "^1.1.0"},
    },
    "B": ...
    ...
 * @returns Object with two properties:
 * - res: boolean, true if the state is valid
 * - msg: metadata of which pkg and dep invalidated the state
 */
export default function verifyState(
  state: StateInternalInterface,
  dnps: DappGetDnps
): {
  valid: boolean;
  reason?: {
    req: string;
    dep: string;
    range: string;
  };
} {
  for (const stateDnp of Object.keys(state).filter(pkg => state[pkg])) {
    const stateVer = state[stateDnp] || "";
    if (!dnps[stateDnp]) {
      throw Error(`DNP ${stateDnp} not in dnps`);
    } else if (!hasVersion(dnps, stateDnp, stateVer)) {
      throw Error(`DNP ${toReq(stateDnp, stateVer)} not in dnps`);
    }
    const deps = getDependencies(dnps, stateDnp, stateVer);
    for (const depDnp of Object.keys(deps)) {
      if (!safeSemver.satisfies(state[depDnp] || "", deps[depDnp])) {
        // This dependency is incompatible
        return {
          valid: false,
          reason: {
            req: toReq(stateDnp, stateVer),
            dep: toReq(depDnp, state[depDnp] || ""),
            range: deps[depDnp]
          }
        };
      }
    }
  }
  return {
    valid: true
  };
}
