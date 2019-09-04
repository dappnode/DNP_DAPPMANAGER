const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const docker = require("modules/docker");
const paramsDefault = require("params");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

chai.should();

describe("Call function: updatePackageEnv", function() {
  // This function gets the manifest of a package,
  // and then gets the avatar refered in the manifest if any
  // Finally returns this data objectified
  const id = "myPackage.eth";
  const testDirectory = "./test_files/";

  const params = {
    ...paramsDefault,
    CACHE_DIR: testDirectory,
    DNCORE_DIR: "DNCORE",
    REPO_DIR: testDirectory
  };

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  const envFilePath = getPath.envFileSmart(id, params);

  const dockerList = {
    listContainers: sinon.stub().resolves([{ name: id }])
  };

  const restartPackage = sinon.stub().resolves();

  const updatePackageEnv = proxyquire("calls/updatePackageEnv", {
    "modules/docker": docker,
    "modules/dockerList": dockerList,
    "./restartPackage": restartPackage,
    params: params
  });

  describe("Call function updatePackageEnv", function() {
    before(() => {
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    });

    beforeEach(() => {
      // Prepare mocks
      restartPackage.resetHistory();
    });

    it("Should update the envs and reset the package", async () => {
      // Execute calls
      let res = await updatePackageEnv({
        id,
        envs: { key: "val" },
        restart: true
      });
      // Verify
      // restartPackage should be used to reset the package
      sinon.assert.calledWith(restartPackage, { id });
      // The envs should have been written
      let envString = fs.readFileSync(envFilePath, "utf8");
      expect(envString).to.include("key=val");
      // And return correctly
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
    });

    it("Should NOT reset the package", async () => {
      // Execute calls
      let res = await updatePackageEnv({
        id,
        envs: { key: "val" },
        restart: false
      });
      // Verify
      // restartPackage should NOT be used to reset the package
      sinon.assert.notCalled(restartPackage);
      // And return correctly
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
    });

    after(() => {
      fs.unlinkSync(dockerComposePath);
      fs.unlinkSync(envFilePath);
    });
  });
});
