import "mocha";
import { expect } from "chai";
import { params } from "@dappnode/params";
import { assertStartStopAllowed } from "../../../src/calls/packageStartStop.js";

describe("Call function: packageStartStop > assertStartStopAllowed", () => {
  const nexusProofs = { dnpName: "nexus-proofs.dnp.dappnode.eth", isCore: true };

  it("starts any stopped core package, including non-whitelisted ones", () => {
    for (const dnp of [
      nexusProofs,
      { dnpName: params.bindDnpName, isCore: true },
      { dnpName: params.dappmanagerDnpName, isCore: true }
    ])
      expect(() => assertStartStopAllowed(dnp, "start"), dnp.dnpName).to.not.throw();
  });

  it("still refuses to stop core packages that are not whitelisted", () => {
    for (const dnp of [
      nexusProofs,
      { dnpName: params.bindDnpName, isCore: true },
      { dnpName: params.dappmanagerDnpName, isCore: true }
    ])
      expect(() => assertStartStopAllowed(dnp, "stop"), dnp.dnpName).to.throw("Core packages cannot be stopped");
  });

  it("keeps whitelisted core packages stoppable", () => {
    for (const dnpName of [
      params.ipfsDnpName,
      params.wifiDnpName,
      params.HTTPS_PORTAL_DNPNAME,
      params.notificationsDnpName
    ])
      expect(() => assertStartStopAllowed({ dnpName, isCore: true }, "stop"), dnpName).to.not.throw();
  });

  it("lets regular packages start and stop", () => {
    const geth = { dnpName: "geth.dnp.dappnode.eth", isCore: false };
    expect(() => assertStartStopAllowed(geth, "stop")).to.not.throw();
    expect(() => assertStartStopAllowed(geth, "start")).to.not.throw();
  });
});
