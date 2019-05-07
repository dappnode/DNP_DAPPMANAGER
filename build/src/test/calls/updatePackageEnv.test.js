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
  const packageName = "myPackage.eth";
  const testDirectory = "./test_files/";

  const params = {
    ...paramsDefault,
    CACHE_DIR: testDirectory,
    DNCORE_DIR: "DNCORE",
    REPO_DIR: testDirectory
  };

  const dockerComposePath = getPath.dockerComposeSmart(packageName, params);
  const envFilePath = getPath.envFileSmart(packageName, params);

  const dockerList = {
    listContainers: sinon.stub().resolves([{ name: packageName }])
  };

  const updatePackageEnv = proxyquire("calls/updatePackageEnv", {
    "modules/docker": docker,
    "modules/dockerList": dockerList,
    params: params
  });

  describe("Call function updatePackageEnv", function() {
    before(() => {
      validate.path(dockerComposePath);
      fs.writeFileSync(dockerComposePath, "docker-compose");
    });

    it("Should update the envs and reset the package", async () => {
      // Prepare mocks
      sinon.restore();
      sinon.replace(docker.compose, "down", sinon.fake());
      sinon.replace(docker.compose, "up", sinon.fake());
      // Execute calls
      let res = await updatePackageEnv({
        id: packageName,
        envs: { key: "val" },
        restart: true
      });
      // Verify
      // docker.compose should be used to reset the package
      sinon.assert.calledWith(docker.compose.up, dockerComposePath);
      // The envs should have been written
      let envString = fs.readFileSync(envFilePath, "utf8");
      expect(envString).to.include("key=val");
      // And return correctly
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
    });

    it("Should NOT reset the package", async () => {
      // Prepare mocks
      docker.compose.down.resetHistory();
      docker.compose.up.resetHistory();
      // Execute calls
      let res = await updatePackageEnv({
        id: packageName,
        envs: { key: "val" },
        restart: false
      });
      // Verify
      // docker.compose should NOT be used to reset the package
      sinon.assert.notCalled(docker.compose.down);
      sinon.assert.notCalled(docker.compose.up);
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
