const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const params = require("params");
const getPath = require("utils/getPath");

chai.should();

describe("Call function: updatePackageEnv", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const packageName = "myPackage.eth";

  const envFilePath = getPath.envFileSmart(packageName, params);

  const docker = {
    composeUp: async () => {},
    getDnpData: async () => ({ isCore: false })
  };

  const updatePackageEnv = proxyquire("calls/updatePackageEnv", {
    "modules/docker": docker,
    params: params
  });

  describe("Call function updatePackageEnv", function() {
    it("Should update the envs and reset the package", async () => {
      // Prepare mocks
      sinon.restore();
      sinon.replace(docker, "composeUp", sinon.fake());
      // Execute calls
      let res = await updatePackageEnv({
        id: packageName,
        envs: { key: "val" }
      });
      // Verify
      // docker.compose should be used to reset the package
      sinon.assert.calledWith(docker.composeUp, packageName);
      // The envs should have been written
      let envString = fs.readFileSync(envFilePath, "utf8");
      expect(envString).to.include("key=val");
      // And return correctly
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
    });

    after(() => {
      try {
        fs.unlinkSync(envFilePath);
      } catch (e) {
        /* eslint-disable no-console */
        console.error(`Error cleaning files: ${e.stack}`);
      }
    });
  });
});
