import "mocha";
import { expect } from "chai";
import { params } from "@dappnode/params";
import { isAllowedToStop } from "../../../src/calls/packageStartStop.js";

describe("Call function: packageStartStop > isAllowedToStop", () => {
  it("lets users stop Nexus Proofs", () => {
    expect(isAllowedToStop({ dnpName: params.nexusProofsDnpName, isCore: true })).to.equal(true);
  });

  it("keeps the existing stoppable core packages stoppable", () => {
    for (const dnpName of [
      params.ipfsDnpName,
      params.wifiDnpName,
      params.HTTPS_PORTAL_DNPNAME,
      params.notificationsDnpName
    ])
      expect(isAllowedToStop({ dnpName, isCore: true }), dnpName).to.equal(true);
  });

  it("still refuses to stop other core packages and the dappmanager", () => {
    expect(isAllowedToStop({ dnpName: params.bindDnpName, isCore: true })).to.equal(false);
    expect(isAllowedToStop({ dnpName: params.dappmanagerDnpName, isCore: true })).to.equal(false);
  });

  it("lets users stop any regular package", () => {
    expect(isAllowedToStop({ dnpName: "geth.dnp.dappnode.eth", isCore: false })).to.equal(true);
  });
});
