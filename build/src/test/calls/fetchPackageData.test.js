const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const fs = require("fs");
const { promisify } = require("util");
const logs = require("logs.js")(module);

chai.should();

describe("Call function: fetchPackageData", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const packageName = "myPackage.eth";
  const avatarHash = "FakeFileAvatarHash";
  const testDirectory = "./test_files/";

  const getManifest = async () => ({
    avatar: avatarHash
  });

  const getAvatar = async () => "data:image/png;base64,avatarb23ib32";

  const fetchPackageData = proxyquire("calls/fetchPackageData", {
    "modules/getManifest": getManifest,
    "modules/getAvatar": getAvatar,
    "utils/isSyncing": async () => false
  });

  describe("Call function fetchPackageData", function() {
    before(async () => {
      await promisify(fs.mkdir)(testDirectory).catch(logs.error);
      await promisify(fs.writeFile)(testDirectory + avatarHash, "data").catch(
        logs.error
      );
    });

    it("should return success message and the package data", async () => {
      let res = await fetchPackageData({ id: packageName });
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
      expect(res).to.have.property("result");
      expect(res.result).to.have.property("manifest");
      expect(res.result).to.have.property("avatar");
      let { manifest, avatar } = res.result;
      expect(manifest).to.deep.include({
        avatar: avatarHash
      });
      expect(avatar).to.be.a("String");
      expect(avatar).to.include("data:image/png;base64,");
    });

    after(async () => {
      await promisify(fs.unlink)(testDirectory + avatarHash).catch(logs.error);
      await promisify(fs.rmdir)(testDirectory).catch(logs.error);
    });
  });
});
