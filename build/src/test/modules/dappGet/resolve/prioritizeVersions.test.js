const proxyquire = require('proxyquire');
const expect = require('chai').expect;

/**
 * Purpose of the test. Make sure the versions are ordered correctly
 *
 * Rules to prioritize versions:
 * 1. Requested package, newest first
 * 2. State package, oldest first
 * 3. New packages, newest first.
 * + Prioritize not installing new packages, first version = null.
 */

const prioritizeVersions =
    proxyquire('modules/dappGet/resolve/prioritizeVersions', {
});

describe('dappGet/resolve/prioritizeVersions', () => {
    it('should order versions: requested DNP. Prioritize newer versions', async () => {
        const dnp = {
            isRequest: true,
            versions: {'0.1.0': {}, '0.1.1': {}},
        };
        const versions = prioritizeVersions(dnp);
        expect(versions).to.deep.equal(['0.1.1', '0.1.0']);
    });

    it('should deal with non-semver versions and prioritize them', async () => {
        const dnp = {
            isRequest: true,
            versions: {'0.1.0': {}, '0.1.1': {}, '/ipfs/Qm1234': {}},
        };
        const versions = prioritizeVersions(dnp);
        expect(versions).to.deep.equal(['/ipfs/Qm1234', '0.1.1', '0.1.0']);
    });

    it('should order versions: state DNP. Prioritize older versions', async () => {
        const dnp = {
            isState: true,
            versions: {'0.1.0': {}, '0.1.1': {}},
        };
        const versions = prioritizeVersions(dnp);
        expect(versions).to.deep.equal(['0.1.0', '0.1.1']);
    });

    it('should order versions: not installed DNP. Prioritize newer versions + null', async () => {
        const dnp = {
            isNotInstalled: true,
            versions: {'0.1.0': {}, '0.1.1': {}},
        };
        const versions = prioritizeVersions(dnp);
        expect(versions).to.deep.equal([null, '0.1.1', '0.1.0']);
    });
});

