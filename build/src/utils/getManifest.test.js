
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

const createGetManifest = require('./getManifest');

chai.should();

describe('Get manifest', function() {
  argumentsTest();
});


function argumentsTest() {
  describe('getManifest', async () => {
    // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)

    const PACKAGE_NAME = 'test.dnp.dappnode.eth';
    const packageReq = {
      name: PACKAGE_NAME,
      ver: 'latest',
    };
    const dnpHash = 'dnpHash';
    const manifest = '{\n  "item": "manifest"\n}';
    const apm_getRepoHash_spy = sinon.spy();
    const apm_Mock = {
      getRepoHash: async (packageReq) => {
        apm_getRepoHash_spy(packageReq);
        return dnpHash;
      },
    };
    const ipfsCalls_cat_spy = sinon.spy();
    const ipfsCalls_Mock = {
      cat: async (dnpHash) => {
        ipfsCalls_cat_spy(dnpHash);
        return manifest;
      },
    };

    const getManifest = createGetManifest(apm_Mock, ipfsCalls_Mock);

    before();
    let res = await getManifest(packageReq);

    it('should call apm.getRepoHash with packageReq', () => {
      expect(apm_getRepoHash_spy.getCalls()[0].args)
        .to.deep.equal( [packageReq] );
    });


    it('should call ipfsCalls.cat with dnpHash', () => {
      expect(ipfsCalls_cat_spy.getCalls()[0].args)
        .to.deep.equal( [dnpHash] );
    });

    it('should return a parsed manifest', () => {
      expect(res)
        .to.deep.equal(JSON.parse(manifest));
    });
  });
}
