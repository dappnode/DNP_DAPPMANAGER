import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import shell from "../../src/utils/shell";
const proxyquire = require("proxyquire").noCallThru();

describe("Call function: removePackage", function() {
  const testDir = "test_files/";
  const params = {
    REPO_DIR: testDir,
    DNCORE_DIR: "DNCORE"
  };

  const id = "test.dnp.dappnode.eth";
  const dockerComposePath = getPath.dockerCompose(id, params, false);
  const dockerComposeTemplate = `
  version: '3.4'
      services:
          ${id}:
              image: 'chentex/random-logger:latest'
              container_name: DNP_DAPPMANAGER_TEST_CONTAINER
  `.trim();

  const idWrong = "missing.dnp.dappnode.eth";

  const docker = {
    compose: {
      down: sinon.stub().resolves()
    }
  };

  const eventBus = {
    requestPackages: { emit: sinon.stub() },
    packageModified: { emit: sinon.stub() }
  };

  // db to know UPnP state
  const db = {
    get: (key: string): boolean => {
      if (key === "upnpAvailable") return true;
      else return false;
    }
  };

  const { default: removePackage } = proxyquire(
    "../../src/calls/removePackage",
    {
      "../modules/docker": docker,
      "../eventBus": eventBus,
      "../params": params,
      "../db": db
    }
  );

  before(async () => {
    validate.path(dockerComposePath);
    fs.writeFileSync(dockerComposePath, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    const res = await removePackage({ id });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should have called docker-compose down", async () => {
    sinon.assert.callCount(docker.compose.down, 1);
    expect(docker.compose.down.firstCall.args).to.deep.equal(
      [dockerComposePath, { volumes: false }],
      `should call docker.compose.down for the package ${id}`
    );
  });

  it("should request to emit packages to refresh the UI", async () => {
    sinon.assert.calledOnce(eventBus.requestPackages.emit);
    sinon.assert.calledOnce(eventBus.packageModified.emit);
    expect(eventBus.packageModified.emit.firstCall.lastArg).to.deep.equal({
      id,
      removed: true
    });
  });

  it("should throw an error with wrong package name", async () => {
    let error = "--- removePackage did not throw ---";
    try {
      await removePackage({ id: idWrong });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("No docker-compose found");
  });

  after(async () => {
    try {
      await shell(`rm -rf ${testDir}`);
    } catch (e) {
      //
    }
  });
});
