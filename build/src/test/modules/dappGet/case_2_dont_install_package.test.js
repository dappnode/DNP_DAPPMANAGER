const resolve = require('modules/dappGet/resolve');
const expect = require('chai').expect;

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

describe('case 2, upgrade state package because of a dependency', () => {
    it('should get correct result', () => {
        const dnps = {
            'A': {
              isRequest: true,
              versions: {
                  '0.1.0': {},
                  '0.1.1': {'B': '^1.0.0'},
                  '0.1.2': {},
              },
            },
            'B': {
                versions: {
                  '1.0.0': {},
                },
            },
          };
        const res = resolve(dnps);
        expect(res.message).to.equal('Found compatible state with case 1/6');
        expect(res.success).to.deep.equal({
            A: '0.1.2',
        });
    });
});
