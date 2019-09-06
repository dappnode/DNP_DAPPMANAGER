import "mocha";
import { expect } from "chai";
import { PackageContainer } from "../../src/types";
import { mockDnp } from "../testUtils";

const proxyquire = require("proxyquire").noCallThru();

describe("Call function: logPackage", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };
  const logsString = "LOGS";

  let hasLogged = false;
  const id = "test.dnp.dappnode.eth";
  const containerName = `DAppNodePackage-${id}`;
  const docker = {
    log: async (): Promise<string> => {
      hasLogged = true;
      return logsString;
    }
  };

  const listContainers = async (): Promise<PackageContainer[]> => [
    { ...mockDnp, name: id, packageName: containerName }
  ];

  const { default: logPackage } = proxyquire("../../src/calls/logPackage", {
    "../modules/docker": docker,
    "../modules/listContainers": listContainers,
    "../params": params
  });

  it("should log the package with correct arguments", async () => {
    await logPackage({ id });
    expect(hasLogged).to.be.true;
  });

  it("should throw an error with wrong package name", async () => {
    let error = "--- logPackage did not throw ---";
    try {
      await logPackage({ id: "anotherPackage.dnp.eth" });
    } catch (e) {
      error = e.message;
    }
    expect(error).to.include("No DNP found for id anotherPackage.dnp.eth");
  });

  it("should return a stringified object containing logs", async () => {
    const res = await logPackage({ id });
    expect(res).to.be.ok;
    expect(res).to.have.property("message");
    expect(res).to.deep.include({
      result: logsString
    });
  });
});
