const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const dockerList = require("modules/dockerList");
const { promisify } = require("util");
const logs = require("logs.js")(module);

chai.should();

describe("Call function: fetchDirectory", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const packageName = "myPackage.eth";
  const avatarHash = "FakeFileAvatarHash";
  const testDirectory = "./test_files/";
  const manifest = { name: "pkgA" };

  describe("Call function fetchDirectory", function() {
    before(async () => {
      await promisify(fs.mkdir)(testDirectory).catch(logs.error);
      await promisify(fs.writeFile)(testDirectory + avatarHash, "data").catch(
        logs.error
      );
    });

    it("should return success message and the directory data", async () => {
      sinon.replace(dockerList, "listContainers", sinon.fake.returns(["pkgA"]));
      const getDirectory = sinon.stub();
      getDirectory.resolves([
        { name: "pkgA", status: "preparing", directoryId: 1 }
      ]);
      const getManifest = sinon.stub();
      getManifest.resolves(manifest);
      const fetchDirectory = proxyquire("calls/fetchDirectory", {
        "modules/getDirectory": getDirectory,
        "modules/dockerList": dockerList,
        "modules/getManifest": getManifest,
        "utils/isSyncing": async () => false
      });
      let res = await fetchDirectory({ id: packageName });
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
      expect(res).to.have.property("result");
      expect(res.result).to.be.an("array");
      expect(res.result).to.deep.equal([
        {
          avatar: undefined,
          manifest: manifest,
          name: "pkgA",
          status: "preparing",
          directoryId: 1
        }
      ]);
    });

    after(async () => {
      await promisify(fs.unlink)(testDirectory + avatarHash).catch(logs.error);
      await promisify(fs.rmdir)(testDirectory).catch(logs.error);
    });
  });
});
