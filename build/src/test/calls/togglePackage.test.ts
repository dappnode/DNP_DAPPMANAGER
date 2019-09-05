import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import * as getPath from "../../src/utils/getPath";
import * as validate from "../../src/utils/validate";
import { mockDnp } from "../testUtils";
const proxyquire = require("proxyquire").noCallThru();

describe("Call function: togglePackage", function() {
  const dockerComposeTemplate = `
version: '3.4'
services:
    otpweb.dnp.dappnode.eth:
        image: 'chentex/random-logger:latest'
        container_name: DNP_DAPPMANAGER_TEST_CONTAINER
`.trim();

  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params)

  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const PACKAGE_NAME = "test.dnp.dappnode.eth";
  const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params, false);

  const docker = {
    compose: {
      stop: sinon.fake.resolves(null)
    }
  };

  const dnpList = [
    {
      ...mockDnp,
      name: PACKAGE_NAME,
      running: true
    }
  ];

  const { default: togglePackage } = proxyquire(
    "../../src/calls/togglePackage",
    {
      "../modules/listContainers": async ({ byName }: { byName: string }) => {
        return dnpList.filter(({ name }) => name === byName);
      },
      "../modules/docker": docker,
      "../params": params
    }
  );

  before(() => {
    validate.path(DOCKERCOMPOSE_PATH);
    fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  });

  it("should stop the package with correct arguments", async () => {
    const res = await togglePackage({ id: PACKAGE_NAME });
    sinon.assert.called(docker.compose.stop);
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
  });

  it("should throw an error with wrong package name", async () => {
    const id = "anotherPackage.dnp.eth";
    let error = "--- togglePackage did not throw ---";
    try {
      await togglePackage({ id });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include(`No DNP was found for name ${id}`);
  });

  after(() => {
    fs.unlinkSync(DOCKERCOMPOSE_PATH);
  });
});
