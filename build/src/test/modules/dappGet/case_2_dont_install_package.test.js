const resolveRequest = require('../../../src/modules/dappGet/resolver');
const assert = require('assert');
const repo = getRepo();

/**
 * Case: Don't install a package if not necessary
 *
 * If A depends on B on specific versions, B will be added as possible package
 * However, it has to be given the option to not be installed, as it happens
 * in the solution of this case.
 *
 * TO SOLVE THIS: In prioritizeVersions.js null versions are added
 * as the first possible version of each newly install package
 */

const state = {
    A: '0.1.0',
};

describe('case 2, upgrade state package because of a dependency', () => {
    it('should get correct result', () => {
        const req = 'A@^0.1.1';
        const res = resolveRequest(req, repo, state);
        assert.deepStrictEqual(res.success, {
            A: '0.1.2',
        });
    });
});


function getRepo() {
    return {
      'A': {
        '0.1.0': {dependencies: {}},
        '0.1.1': {dependencies: {'B': '^1.0.0'}},
        '0.1.2': {dependencies: {}},
      },
      'B': {
        '1.0.0': {dependencies: {}},
      },
    };
  }


