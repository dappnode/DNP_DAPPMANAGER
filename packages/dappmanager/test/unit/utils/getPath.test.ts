import "mocha";
import chai, { expect } from "chai";
import path from "path";

chai.should();

import * as getPath from "../../../src/utils/getPath.js";
import params from "../../../src/params.js";

const { REPO_DIR } = params;

describe("Util: get paths", function () {
  const dnpName = "some_package.dnp.dappnode.eth";
  const version = "0.2.0";

  it("return PACKAGE_REPO_DIR path", () => {
    expect(getPath.packageRepoDir(dnpName, false)).to.equal(
      path.join(REPO_DIR, dnpName)
    );
  });

  it("return MANIFEST path", () => {
    expect(getPath.manifest(dnpName, false)).to.equal(
      path.join(REPO_DIR, "some_package.dnp.dappnode.eth/dappnode_package.json")
    );
  });

  it("return DOCKERCOMPOSE path", () => {
    expect(getPath.dockerCompose(dnpName, false)).to.equal(
      path.join(REPO_DIR, "some_package.dnp.dappnode.eth/docker-compose.yml")
    );
  });

  it("return ENV_FILE path", () => {
    expect(getPath.envFile(dnpName, false)).to.equal(
      path.join(
        REPO_DIR,
        "some_package.dnp.dappnode.eth/some_package.dnp.dappnode.eth.env"
      )
    );
  });

  it("return IMAGE path", () => {
    expect(getPath.image(dnpName, version, false)).to.equal(
      path.join(
        REPO_DIR,
        "some_package.dnp.dappnode.eth/some_package.dnp.dappnode.eth_0.2.0.tar.xz"
      )
    );
  });

  describe("backup path", () => {
    const nextPaths = {
      "docker-compose.yml": "docker-compose.backup.yml",
      "DNCORE/docker-compose.yml": "DNCORE/docker-compose.backup.yml",
      "/dnp_repo/my.dnp.dappnode.eth/docker-compose.yml":
        "/dnp_repo/my.dnp.dappnode.eth/docker-compose.backup.yml",
      "dappnode_package.json": "dappnode_package.backup.json"
    };
    for (const [from, next] of Object.entries(nextPaths))
      it(`Should return next path of ${from}`, () => {
        expect(getPath.backupPath(from)).to.equal(next);
      });
  });
});
