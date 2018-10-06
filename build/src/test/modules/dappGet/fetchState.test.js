const proxyquire = require('proxyquire');
const expect = require('chai').expect;
const sinon = require('sinon');

/**
 * Purpose of the test. Make sure that wierd dev versions are ignored
 */

const state = {
    'dappmanager.dnp.dappnode.eth': '0.1.0',
    'ipfs.dnp.dappnode.eth': '/ipfs/Qmabr9X4JeuUFEmSngFunBCTmKeSMtuKfnjckWkQY7EPRs',
    'testing.dnp.dappnode.eth': 'dev',
    'new_release.dnp.dappnode.eth': 'xu77xs8668a68sx',
};
const repo = {A: '0.0.1'};
const getPkgDeps = sinon.stub();
// Make it async
getPkgDeps.resolves();
const fetchState = proxyquire('modules/dappGet/fetch/fetchState', {
    './getPkgDeps': getPkgDeps,
});

describe('dappGet/state/fetchState', () => {
    it('should request correct ranges and ignore wierd versions', async () => {
        await fetchState(state, repo);
        sinon.assert.callCount(getPkgDeps, 2);
        // First call should request >= version
        expect(getPkgDeps.getCall(0).args[1])
        .to.equal('>=0.1.0');
        // Second call should request exact ipfs version
        expect(getPkgDeps.getCall(1).args[1])
        .to.equal('/ipfs/Qmabr9X4JeuUFEmSngFunBCTmKeSMtuKfnjckWkQY7EPRs');
    });
});


