import { expect } from "chai";
import sinon from "sinon";
import { docker } from "@dappnode/dockerapi";
import { params, dockerNetworkPolicy } from "@dappnode/params";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { createDockerNetwork } from "../../src/dockerNetworkConfigs/createDockerNetwork.js";
import { setDappmanagerAndBindFirst } from "../../src/dockerNetworkConfigs/index.js";

describe("Docker network allocation pools", () => {
  afterEach(() => sinon.restore());

  it("creates fresh networks with fixed core IPs outside the allocation pool", async () => {
    sinon.stub(docker, "listNetworks").resolves([]);
    const create = sinon.stub(docker, "createNetwork").resolves();
    const policy = dockerNetworkPolicy.networks.dnprivate_network;
    await createDockerNetwork({ networkName: "dnprivate_network", ...policy });
    expect(create.firstCall.args[0].IPAM?.Config).to.deep.equal([
      { Subnet: "10.20.0.0/24", IPRange: "10.20.0.128/25", Gateway: "10.20.0.1" }
    ]);
  });

  it("does not silently recreate an existing legacy network", async () => {
    sinon.stub(docker, "listNetworks").resolves([{ Name: "dnprivate_network" }]);
    const inspect = sinon.stub().resolves({ IPAM: { Config: [{ Subnet: "10.20.0.0/24" }] } });
    sinon.stub(docker, "getNetwork").returns({ inspect });
    const create = sinon.stub(docker, "createNetwork");
    await createDockerNetwork({ networkName: "dnprivate_network", ...dockerNetworkPolicy.networks.dnprivate_network });
    expect(create.called).to.equal(false);
  });

  it("prioritizes DNS and manager using package identifiers without mutating inventory", () => {
    const packages = ["ordinary.dnp.dappnode.eth", params.dappmanagerDnpName, params.bindDnpName].map((dnpName) => ({
      dnpName
    })) as InstalledPackageDataApiReturn[];
    expect(setDappmanagerAndBindFirst(packages).map((p) => p.dnpName)).to.deep.equal([
      params.bindDnpName,
      params.dappmanagerDnpName,
      "ordinary.dnp.dappnode.eth"
    ]);
    expect(packages[0].dnpName).to.equal("ordinary.dnp.dappnode.eth");
  });
});
