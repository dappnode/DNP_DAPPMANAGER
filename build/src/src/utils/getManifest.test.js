
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
    const apmGetRepoHashSpy = sinon.spy();
    const apmMock = {
      getRepoHash: async (packageReq) => {
        apmGetRepoHashSpy(packageReq);
        return dnpHash;
      },
    };
    const ipfsCatSpy = sinon.spy();
    const ipfsMock = {
      cat: async (dnpHash) => {
        ipfsCatSpy(dnpHash);
        return manifest;
      },
    };

    const getManifest = createGetManifest(apmMock, ipfsMock);

    before();
    let res = await getManifest(packageReq);

    it('should call apm.getRepoHash with packageReq', () => {
      expect(apmGetRepoHashSpy.getCalls()[0].args)
        .to.deep.equal( [packageReq] );
    });


    it('should call ipfs.cat with dnpHash', () => {
      expect(ipfsCatSpy.getCalls()[0].args)
        .to.deep.equal( [dnpHash] );
    });

    it('should return a parsed manifest', () => {
      expect(res)
        .to.deep.equal(JSON.parse(manifest));
    });
  });
}
