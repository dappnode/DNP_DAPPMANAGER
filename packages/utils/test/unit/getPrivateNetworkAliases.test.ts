import { expect } from "chai";
import { getPrivateNetworkAliases } from "../../src/getPrivateNetworkAliases.js";

describe("getPrivateNetworkAliases", () => {
  // Mock params
  const params = {
    dappmanagerDnpName: "dappmanager.dnp.dappnode.eth",
    DAPPMANAGER_ALIASES: [
      "dappmanager.dnp.dappnode.eth.dappmanager.dappnode",
      "dappmanager.dappnode",
      "my.dappnode",
      "dappnode.local"
    ]
  };

  it("should return an array with the full alias for any container", () => {
    // Test with a sample container
    const container = {
      serviceName: "testService",
      dnpName: "testDnp",
      isMainOrMonoservice: false
    };
    const result = getPrivateNetworkAliases(container);
    expect(result).to.be.an("array").that.includes("testService.testDnp.dappnode");
  });

  it("should include the short alias for main or monoservice containers", () => {
    const container = {
      serviceName: "mainService",
      dnpName: "mainDnp",
      isMainOrMonoservice: true
    };
    const result = getPrivateNetworkAliases(container);
    expect(result).to.include("mainService.mainDnp.dappnode", "'mainDnp.dappnode'");
  });

  it("should not include the short alias for non-main/monoservice containers", () => {
    const container = {
      serviceName: "regularService",
      dnpName: "regularDnp",
      isMainOrMonoservice: false
    };
    const result = getPrivateNetworkAliases(container);
    expect(result).to.not.include("regularService");
  });

  it("should include special aliases for the dappmanager", () => {
    const container = {
      serviceName: "dappmanager.dnp.dappnode.eth",
      dnpName: params.dappmanagerDnpName,
      isMainOrMonoservice: true
    };
    const result = getPrivateNetworkAliases(container);
    console.log(result);

    expect(result).to.include.members(params.DAPPMANAGER_ALIASES);
  });

  it("should return unique aliases", () => {
    const container = {
      serviceName: "admin",
      dnpName: params.dappmanagerDnpName,
      isMainOrMonoservice: true
    };
    const result = getPrivateNetworkAliases(container);
    expect(result).to.have.members([...new Set(result)]);
  });

  // Add more edge case tests here
});
