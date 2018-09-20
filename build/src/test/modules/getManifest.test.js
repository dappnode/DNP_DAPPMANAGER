const proxyquire = require('proxyquire');
const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');

chai.should();

describe('Get manifest', function() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)

  const PACKAGE_NAME = 'test.dnp.dappnode.eth';
  const packageReq = {
    name: PACKAGE_NAME,
    ver: 'latest',
  };
  const dnpHash = 'dnpHash';
  const manifest = '{\n  "item": "manifest"\n}';
  const apmGetRepoHashSpy = sinon.spy();
  const apm = {
    getRepoHash: async (packageReq) => {
      apmGetRepoHashSpy(packageReq);
      return dnpHash;
    },
  };
  const ipfsCatSpy = sinon.spy();
  const ipfs = {
    cat: async (dnpHash) => {
      ipfsCatSpy(dnpHash);
      return manifest;
    },
  };

  const getManifest = proxyquire('modules/getManifest', {
    'modules/ipfs': ipfs,
    'modules/apm': apm,
  });

  let res;
  it('should call getManifest without throwing', async () => {
    res = await getManifest(packageReq);
  });

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
      .to.deep.equal({
        fromIpfs: undefined,
        isCore: undefined,
        item: 'manifest',
      });
  });
});
