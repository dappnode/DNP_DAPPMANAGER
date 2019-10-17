import "mocha";
import chai, { expect } from "chai";
import path from "path";

chai.should();

import * as getPath from "../../src/utils/getPath";

const testDir = "test_files/";

describe("Util: get paths", function() {
  const name = "some_package";
  const version = "0.2.0";

  it("return PACKAGE_REPO_DIR path", () => {
    expect(getPath.packageRepoDir(name, false)).to.equal(testDir + name);
  });

  it("return MANIFEST path", () => {
    expect(getPath.manifest(name, false)).to.equal(
      path.join(testDir, "some_package/dappnode_package.json")
    );
  });

  it("return DOCKERCOMPOSE path", () => {
    expect(getPath.dockerCompose(name, false)).to.equal(
      path.join(testDir, "some_package/docker-compose.yml")
    );
  });

  it("return ENV_FILE path", () => {
    expect(getPath.envFile(name, false)).to.equal(
      path.join(testDir, "some_package/some_package.env")
    );
  });

  it("return IMAGE path", () => {
    expect(getPath.image(name, version, false)).to.equal(
      path.join(testDir, "some_package/some_package_0.2.0.tar.xz")
    );
  });

  describe("next path", () => {
    const nextPaths = {
      "docker-compose.yml": "docker-compose.next.yml",
      "DNCORE/docker-compose.yml": "DNCORE/docker-compose.next.yml",
      "/dnp_repo/my.dnp.dappnode.eth/docker-compose.yml":
        "/dnp_repo/my.dnp.dappnode.eth/docker-compose.next.yml",
      "dappnode_package.json": "dappnode_package.next.json"
    };
    for (const [from, next] of Object.entries(nextPaths))
      it(`Should return next path of ${from}`, () => {
        expect(getPath.nextPath(from)).to.equal(next);
      });
  });
});
