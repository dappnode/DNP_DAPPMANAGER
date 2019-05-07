const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const fs = require("fs");
const getPath = require("utils/getPath");
const validate = require("utils/validate");

chai.should();

describe("Call function: logPackage", function() {
  mockTest();
});

const dockerComposeTemplate = `
version: '3.4'
services:
    otpweb.dnp.dappnode.eth:
        image: 'chentex/random-logger:latest'
        container_name: DNP_DAPPMANAGER_TEST_CONTAINER
`.trim();

function mockTest() {
  describe("mock test", function() {
    const params = {
      DNCORE_DIR: "DNCORE",
      REPO_DIR: "test_files/"
    };
    const logsString = "LOGS";

    let hasLogged = false;
    const PACKAGE_NAME = "test.dnp.dappnode.eth";
    const docker = {
      log: async () => {
        hasLogged = true;
        return logsString;
      }
    };

    const logPackage = proxyquire("calls/logPackage", {
      "modules/docker": docker,
      params: params
    });

    before(() => {
      const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
      validate.path(DOCKERCOMPOSE_PATH);
      fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
    });

    it("should log the package with correct arguments", async () => {
      await logPackage({ id: PACKAGE_NAME });
      expect(hasLogged).to.be.true;
    });

    it("should throw an error with wrong package name", async () => {
      let error = "--- logPackage did not throw ---";
      try {
        await logPackage({ id: "anotherPackage.dnp.eth" });
      } catch (e) {
        error = e.message;
      }
      expect(error).to.include("No docker-compose found");
    });

    it("should return a stringified object containing logs", async () => {
      let res = await logPackage({ id: PACKAGE_NAME });
      expect(res).to.be.ok;
      expect(res).to.have.property("message");
      expect(res).to.deep.include({
        result: logsString
      });
    });
  });
}
