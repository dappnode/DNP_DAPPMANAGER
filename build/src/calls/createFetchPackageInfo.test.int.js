const chai = require('chai');
const expect = require('chai').expect;
const {
  createFetchPackageInfo,
} = require('./createFetchPackageInfo');

chai.should();

describe('Call function: fetchPackageInfo', function() {
  describe.skip('[INTEGRATION TEST] Call function fetchPackageInfo', () => {
    const params = require('../params');
    const createGetManifest = require('../utils/getManifest');
    const createAPM = require('../modules/apm');
    const ipfsCalls = require('../modules/ipfsCalls');
    const web3Setup = require('../modules/web3Setup');
    // customize params:
    params.WEB3HOSTWS = 'wss://mainnet.infura.io/ws';
    params.IPFS = 'ipfs.infura.io';

    // initialize dependencies
    const web3 = web3Setup(params); // <-- web3
    const apm = createAPM(web3);
    const getManifest = createGetManifest(apm, ipfsCalls);
    const fetchPackageInfo = createFetchPackageInfo(getManifest, apm);

    const packageReq = 'otpweb.dnp.dappnode.eth';
    let res;

    it('should return a stringified response', async () => {
      res = await fetchPackageInfo([packageReq]);
      expect( res ).to.be.a('string');
    });

    it('should return success', async () => {
      let parsedRes = JSON.parse(res);
      expect( parsedRes.success ).to.be.true;
    });

    it('should return a valid list of packages', async () => {
      let parsedRes = JSON.parse(res);
      expect(parsedRes.result.name).to.equal(packageReq);
      expect(parsedRes.result.versions).to.be.an('array');
    });

    it('should return a manifests attached to each version', async () => {
      let parsedRes = JSON.parse(res);
      expect(parsedRes.result.versions[2].manifest.name).to.equal(packageReq);
    });
  });
});
