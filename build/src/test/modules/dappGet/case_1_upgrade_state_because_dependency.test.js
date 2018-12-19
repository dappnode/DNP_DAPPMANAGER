const resolve = require('modules/dappGet/resolve');
const expect = require('chai').expect;

/**
 * Comments about semver
 * As range you can pass a range or a specific version
 *                    req     range
 * semver.satisfies('1.2.3', '^1.1.0') -> true
 * semver.satisfies('1.2.3', '1.2.3')  -> true
 */

describe('case 1, upgrade state package because of a dependency', () => {
    it('should get correct result', () => {
        const dnps = {
          'A': {
            isRequest: true,
            versions: {
              '1.0.0': {'C': '^1.0.0'},
              '2.0.0': {'C': '^2.0.0'},
            },
          },
          'B': {
            isState: true,
            versions: {
              '1.0.0': {'C': '^1.0.0'},
              '2.0.0': {'C': '^2.0.0'},
            },
          },
          'C': {
            isState: true,
            versions: {
              '1.0.0': {},
              '2.0.0': {},
            },
          },
        };
        const res = resolve(dnps);
        expect(res.message).to.equal('Found compatible state with case 4/8');
        expect(res.success).to.deep.equal({
            A: '2.0.0',
            B: '2.0.0',
            C: '2.0.0',
        });
    });
});
