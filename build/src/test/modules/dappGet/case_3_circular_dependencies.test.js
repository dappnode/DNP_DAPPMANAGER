const resolve = require('modules/dappGet/resolve');
const expect = require('chai').expect;

/**
 * Case: Deal with circular dependencies.
 *
 * If not dealt properly circular dependencies create an infinite loop when
 * a resolver is fetching the dependencies of said packages
 * 3 types of loops will be tested
 *   C = Circular
 *   C1 = unitary circular dependency,
 *        C1-A => C1-A
 *   C2 = double circular dependency,
 *        C2-A => C2-B => C2-A
 *   C3 = tripple circular dependency
 *        C3-A => C3-B => C3-C => C3-A
 *
 * TO SOLVE THIS: In getPkgsToInstall.js, if a specific package and version
 * has been already fetched, it will not be fetched again
 */

describe('case 3, upgrade state package because of a dependency', () => {
    it('should deal with unitary circular dependency', () => {
        const dnps = {
          'C1-A': {
            isRequest: true,
            versions: {
              '1.0.0': {'C1-A': '1.0.0'},
            },
          },
        };
        const res = resolve(dnps);
        expect(res.message).to.equal('Found compatible state with case 1/1');
        expect(res.success).to.deep.equal({
          'C1-A': '1.0.0',
        });
    });

    it('should deal with double circular dependency', () => {
        const dnps = {
          'C2-A': {
            isRequest: true,
            versions: {
              '1.0.0': {'C2-B': '1.0.0'},
            },
          },
          'C2-B': {
            versions: {
              '1.0.0': {'C2-A': '1.0.0'},
            },
          },
        };
        const res = resolve(dnps);
        expect(res.message).to.equal('Found compatible state with case 2/2');
        expect(res.success).to.deep.equal({
          'C2-A': '1.0.0',
          'C2-B': '1.0.0',
        });
    });

    it('should deal with tripple circular dependency', () => {
        const dnps = {
          'C3-A': {
            isRequest: true,
            versions: {
              '1.0.0': {'C3-B': '1.0.0'},
            },
          },
          'C3-B': {
            versions: {
              '1.0.0': {'C3-C': '1.0.0'},
            },
          },
          'C3-C': {
            versions: {
              '1.0.0': {'C3-A': '1.0.0'},
            },
          },
        };
        const res = resolve(dnps);
        expect(res.message).to.equal('Found compatible state with case 4/4');
        expect(res.success).to.deep.equal({
          'C3-A': '1.0.0',
          'C3-B': '1.0.0',
          'C3-C': '1.0.0',
        });
    });
});
