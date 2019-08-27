import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import { promisify } from "util";
const logs = require("../../src/logs")(module);

const proxyquire = require("proxyquire").noCallThru();

describe("Call function: fetchDirectory", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const packageName = "myPackage.eth";
  const avatarHash = "FakeFileAvatarHash";
  const testDirectory = "./test_files/";
  const manifest = { name: "pkgA" };
  const avatar = "base64-avatar-mockmockmockmock";

  describe("Call function fetchDirectory", function() {
    before(async () => {
      await promisify(fs.mkdir)(testDirectory).catch(logs.error);
      await promisify(fs.writeFile)(testDirectory + avatarHash, "data").catch(
        logs.error
      );
    });

    it("should return success message and the directory data", async () => {
      const getDirectory = sinon.stub();
      getDirectory.resolves([
        { name: "pkgA", status: "preparing", directoryId: 1 }
      ]);

      const getManifest = sinon.stub();
      getManifest.resolves(manifest);

      const getAvatar = sinon.stub();
      getAvatar.resolves(avatar);

      const { default: fetchDirectory } = proxyquire(
        "../../src/calls/fetchDirectory",
        {
          "../modules/getDirectory": getDirectory,
          "../modules/listContainers": async () => ["pkgA"],
          "../modules/getManifest": getManifest,
          "../modules/getAvatar": getAvatar,
          "../utils/isSyncing": async () => false
        }
      );

      const res = await fetchDirectory({ id: packageName });
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
