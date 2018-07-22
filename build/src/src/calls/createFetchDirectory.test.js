const chai = require('chai');
const expect = require('chai').expect;
const sinon = require('sinon');
const createListDirectory = require('calls/createListDirectory');
const fs = require('fs');
const dockerList = require('modules/dockerList');

chai.should();

describe('Call function: createListDirectory', function() {
    // This function gets the manifest of a package,
    // and then gets the avatar refered in the manifest if any
    // Finally returns this data objectified
  const packageName = 'myPackage.eth';
  const avatarHash = 'FakeFileAvatarHash';
  const testDirectory = './test/';


  describe('Call function createListDirectory', function() {
    before(() => {
        fs.writeFileSync(testDirectory + avatarHash, 'data');
    });

    it('should return success message and the directory data', async () => {
      sinon.replace(dockerList, 'listContainers', sinon.fake.returns(['pkgA']));
      const getDirectory = sinon.stub();
      getDirectory.resolves(['pkgA']);
      const listDirectory = createListDirectory({
        getDirectory,
        dockerList,
      });
      let res = await listDirectory({id: packageName});
      expect( res ).to.be.ok;
      expect( res ).to.have.property('message');
      expect( res ).to.have.property('result');
      expect( res.result ).to.be.an('array');
      expect( res.result ).to.deep.equal(['pkgA']);
    });

    after(() => {
        fs.unlinkSync(testDirectory + avatarHash);
    });
  });
});


