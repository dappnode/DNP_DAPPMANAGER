const resolveRequest = require('modules/dappGet/resolver');
const assert = require('assert');
const repo = getRepo();

/**
 * Comments about semver
 * As range you can pass a range or a specific version
 *                    req     range
 * semver.satisfies('1.2.3', '^1.1.0') -> true
 * semver.satisfies('1.2.3', '1.2.3')  -> true
 */

const state = {
    A: '1.0.0',
    B: '1.0.0',
    C: '1.0.0',
};

describe('case 1, upgrade state package because of a dependency', () => {
    it('should get correct result', () => {
        const req = 'A@^2.0.0';
        const res = resolveRequest(req, repo, state);
        assert.deepStrictEqual(res.success, {
            A: '2.0.0',
            B: '2.0.0',
            C: '2.0.0',
        });
    });
});


function getRepo() {
    return {
      'A': {
        '1.0.0': {'C': '^1.0.0'},
        '2.0.0': {'C': '^2.0.0'},
      },
      'B': {
        '1.0.0': {'C': '^1.0.0'},
        '2.0.0': {'C': '^2.0.0'},
      },
      'C': {
        '1.0.0': {},
        '2.0.0': {},
      },
    };
  }


