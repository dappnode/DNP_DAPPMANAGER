import { expect } from "chai";
import sinon from "sinon";
import type { Request, Response } from "express";
import { docker } from "@dappnode/dockerapi";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { dataSend } from "../../../src/api/routes/dataSend.js";
import { getDnpFromIp } from "../../../src/api/routes/sign.js";
import { dockerApiResponseContainers } from "../../../../dockerApi/test/unit/dockerApiSamples/containers.js";

const dnpName = "tailscale.dnp.dappnode.eth";
const reference = dockerApiResponseContainers[0];
const containers = ["tailscale", "reporter"].map((serviceName, index) => ({
  ...reference,
  Id: serviceName,
  Names: [`/DAppNodePackage-${serviceName}.${dnpName}`],
  Labels: { "com.docker.compose.service": serviceName },
  NetworkSettings: {
    Networks: {
      dncore_network: {
        ...reference.NetworkSettings.Networks.dncore_network,
        IPAddress: `172.33.0.${10 + index}`
      },
      dnprivate_network: {
        ...reference.NetworkSettings.Networks.dncore_network,
        IPAddress: `10.20.0.${10 + index}`
      }
    }
  }
}));

describe("Tailscale reporter package data", () => {
  beforeEach(() => sinon.stub(docker, "listContainers").resolves(containers));
  afterEach(() => sinon.restore());

  it("attributes the reporter container's dncore source IP to its multi-service package", async () => {
    const reporter = await getDnpFromIp("::ffff:172.33.0.11");
    expect(reporter.dnpName).to.equal(dnpName);
    expect(reporter.serviceName).to.equal("reporter");
    expect(reporter.privateIp).to.equal("10.20.0.11");
    const tailscale = await getDnpFromIp("172.33.0.10");
    expect(tailscale.dnpName).to.equal(dnpName);
    expect(tailscale.serviceName).to.equal("tailscale");
  });

  it("stores the text/plain JSON string under the source package and requests UI updates", async () => {
    const payload = JSON.stringify({
      version: 1,
      state: "NeedsLogin",
      online: false,
      authUrl: "https://login.tailscale.com/a/MOCK",
      updatedAt: 1793260800
    });
    sinon.stub(db.packageSentData, "get").returns({});
    const set = sinon.stub(db.packageSentData, "set");
    const emit = sinon.spy(eventBus.requestPackages, "emit");
    const response = { status: sinon.stub().returnsThis(), send: sinon.spy() };
    await dataSend(
      { ip: "::ffff:172.33.0.11", query: { key: "tailscale.status" }, body: payload } as unknown as Request,
      response as unknown as Response,
      () => undefined
    );
    expect(set.calledOnceWithExactly(dnpName, { "tailscale.status": payload })).to.equal(true);
    expect(emit.calledOnce).to.equal(true);
    expect(response.status.calledWith(200)).to.equal(true);
  });

  it("rejects an unknown sender even if its body claims the Tailscale package", async () => {
    const set = sinon.stub(db.packageSentData, "set");
    const response = { status: sinon.stub().returnsThis(), send: sinon.spy() };
    await dataSend(
      {
        ip: "172.33.0.99",
        query: { key: "tailscale.status" },
        body: JSON.stringify({ dnpName })
      } as unknown as Request,
      response as unknown as Response,
      () => undefined
    );
    expect(response.status.calledWith(405)).to.equal(true);
    expect(set.called).to.equal(false);
  });
});
