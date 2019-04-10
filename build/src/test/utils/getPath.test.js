const chai = require("chai");
const path = require("path");

chai.should();

const getPath = require("utils/getPath");

const testDir = "test_files/";

describe("Util: get paths", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: testDir // ### Temporary name for development
  };

  const packageName = "some_package";
  const imageName = "some_image.tar.xz";

  it("return PACKAGE_REPO_DIR path", () => {
    getPath
      .packageRepoDir(packageName, params)
      .should.equal(testDir + packageName);
  });

  it("return MANIFEST path", () => {
    getPath
      .manifest(packageName, params)
      .should.equal(path.join(testDir, packageName, "dappnode_package.json"));
  });

  it("return DOCKERCOMPOSE path", () => {
    getPath
      .dockerCompose(packageName, params)
      .should.equal(path.join(testDir, packageName, "docker-compose.yml"));
  });

  it("return ENV_FILE path", () => {
    getPath
      .envFile(packageName, params)
      .should.equal(path.join(testDir, packageName, `${packageName}.env`));
  });

  it("return IMAGE path", () => {
    getPath
      .image(packageName, imageName, params)
      .should.equal(path.join(testDir, packageName, imageName));
  });
});
