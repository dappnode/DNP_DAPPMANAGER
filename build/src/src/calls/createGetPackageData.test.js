const chai = require('chai');
const expect = require('chai').expect;
const createGetPackageData = require('calls/createGetPackageData');
const fs = require('fs');

chai.should();

describe('Call function: createGetPackageData', function() {
    // This function gets the manifest of a package,
    // and then gets the avatar refered in the manifest if any
    // Finally returns this data objectified
  const packageName = 'myPackage.eth';
  const avatarHash = 'FakeFileAvatarHash';
  const testDirectory = './test/';

  const getManifestMock = async (packageReq) => ({
    avatar: avatarHash,
  });

  const ipfsMock = {
    cat: async () => 'avatar',
  };

  const paramsMock = {
    CACHE_DIR: testDirectory,
  };

  const getPackageData = createGetPackageData({
    getManifest: getManifestMock,
    ipfs: ipfsMock,
    params: paramsMock,
  });

  describe('Call function createGetPackageData', function() {
    before(() => {
        fs.writeFileSync(testDirectory + avatarHash, 'data');
    });

    it('should return success message and the package data', async () => {
      let res = await getPackageData({id: packageName});
      expect( res ).to.be.ok;
      expect( res ).to.have.property('message');
      expect( res ).to.have.property('result');
      expect( res.result ).to.have.property('manifest');
      expect( res.result ).to.have.property('avatar');
      let {manifest, avatar} = res.result;
      expect( manifest ).to.deep.include({
          avatar: avatarHash,
      });
      expect( avatar ).to.be.a('String');
      expect( avatar ).to.include('data:image/png;base64');
    });

    after(() => {
        fs.unlinkSync(testDirectory + avatarHash);
    });
  });
});


