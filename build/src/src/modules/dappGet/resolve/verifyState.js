const safeSemver = require('../utils/safeSemver');
const {hasVersion, getDependencies} = require('../utils/dnpUtils');

/**
 * Checks if a specific combination of DNP versions is valid
 * It invalidates the state at the first incompatibility found
 *
 * @param {object} state Combination of DNP versions
 * {A: '2.0.0, B: '1.1.0', C: '1.0.0'}
 * @param {object} dnps The entire dnps, displaying all DNP versions and their deps
  * repo = {
    "A": {
        "1.0.0": {"C": "^1.0.0"},
        "2.0.0": {"C": "^2.0.0", "D": "^1.0.0"},
        "2.1.0": {"C": "^2.0.0", "D": "^1.1.0"},
    },
    "B": ...
    ...
 * @return {obj} Object with two properties:
 * - res: boolean, true if the state is valid
 * - msg: metadata of which pkg and dep invalidated the state
 */
function verifyState(state, dnps) {
    for (const stateDnp of Object.keys(state).filter((pkg) => state[pkg])) {
        const stateVer = state[stateDnp];
        if (!dnps[stateDnp]) {
            throw Error('DNP '+stateDnp+' not in dnps');
        } else if (!hasVersion(dnps, stateDnp, stateVer)) {
            throw Error('DNP version '+stateDnp+'@'+stateVer+' not in dnps');
        }
        let deps = getDependencies(dnps, stateDnp, stateVer);
        for (const depDnp of Object.keys(deps)) {
            if (!safeSemver.satisfies(state[depDnp], deps[depDnp])) {
                // This dependency is incompatible
                return {
                    valid: false,
                    reason: {
                        req: stateDnp+'@'+stateVer,
                        dep: depDnp+'@'+state[depDnp],
                        range: deps[depDnp],
                    },
                };
            }
        }
    }
    return {
        valid: true,
    };
}

module.exports = verifyState;
