import "mocha";
import { expect } from "chai";
import { Priority, Status } from "@dappnode/types";
import { getKernelMitigationNotification } from "../../src/hostReboot/kernelMitigationNotification.js";

const dnpName = "dappmanager.dnp.dappnode.eth";
describe("kernel mitigation notifications", () => {
  it("keeps an active mitigation warning open without claiming the kernel is fixed", () => {
    const result = getKernelMitigationNotification("mitigated", dnpName);
    expect(result?.status).to.equal(Status.triggered);
    expect(result?.body).to.contain("do not fix");
  });

  it("escalates lost protection and requests remote delivery", () => {
    const previous = getKernelMitigationNotification("mitigated", dnpName);
    const result = getKernelMitigationNotification("failed", dnpName, previous);
    expect(result?.priority).to.equal(Priority.high);
    expect(result?.isRemote).to.equal(true);
  });

  it("does not repeat an unchanged notification after a restart", () => {
    const previous = getKernelMitigationNotification("mitigated", dnpName);
    expect(getKernelMitigationNotification("mitigated", dnpName, previous)).to.equal(undefined);
  });

  it("updates a failure notification after the mitigation recovers", () => {
    const previous = getKernelMitigationNotification("failed", dnpName);
    expect(getKernelMitigationNotification("mitigated", dnpName, previous)?.priority).to.equal(Priority.medium);
  });

  it("resolves explicit removal without asserting patch status", () => {
    const previous = getKernelMitigationNotification("mitigated", dnpName);
    const result = getKernelMitigationNotification("removed", dnpName, previous);
    expect(result?.status).to.equal(Status.resolved);
    expect(result?.body).to.contain("does not verify");
    expect(getKernelMitigationNotification("removed", dnpName)).to.equal(undefined);
  });

  it("does not resolve an existing alert on missing or inapplicable data", () => {
    const previous = getKernelMitigationNotification("failed", dnpName);
    expect(getKernelMitigationNotification(undefined, dnpName, previous)).to.equal(undefined);
    expect(getKernelMitigationNotification("not-applicable", dnpName, previous)).to.equal(undefined);
  });
});
