const semver = require('semver');

/**
 * Checks if a specific combination of package versions is valid
 * It invalidates the state at the first incompatibility found
 *
 * @param {object} state Combination of package versions
 * {A: '2.0.0, B: '1.1.0', C: '1.0.0'}
 * @param {object} repo The entire repo, displaying all package versions and their deps
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
function verifyState(state, repo) {
    for (const statePkg of Object.keys(state).filter((pkg) => state[pkg])) {
        const stateVer = state[statePkg];
        if (!repo[statePkg]) {
            throw Error('package '+statePkg+' not in repo');
        } else if (!repo[statePkg][stateVer]) {
            throw Error('package version '+statePkg+'@'+stateVer+' not in repo');
        }
        let deps = repo[statePkg][stateVer];
        for (const depPkg of Object.keys(deps)) {
            if (!semver.satisfies(state[depPkg], deps[depPkg])) {
                // This dependency is incompatible
                return {
                    valid: false,
                    reason: {
                        req: statePkg+'@'+stateVer,
                        dep: depPkg+'@'+state[depPkg],
                        range: deps[depPkg],
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
