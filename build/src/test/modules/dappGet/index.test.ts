import "mocha";
import { expect } from "chai";
import sinon from "sinon";
const proxyquire = require("proxyquire").noCallThru();

/* eslint-disable max-len */

/**
 * Purpose of the test. Make sure packages are moved to the alreadyUpgraded object
 */

const listContainers = sinon.stub().callsFake(async () => {
  return [
    {
      dependencies: {
        "nginx-proxy.dnp.dappnode.eth": "latest",
        "letsencrypt-nginx.dnp.dappnode.eth": "latest"
      },
      name: "web.dnp.dappnode.eth",
      version: "0.1.0",
      origin: undefined
    },
    {
      dependencies: { "nginx-proxy.dnp.dappnode.eth": "latest" },
      name: "nginx-proxy.dnp.dappnode.eth",
      version: "0.0.3",
      origin: undefined
    },
    {
      dependencies: { "web.dnp.dappnode.eth": "latest" },
      name: "letsencrypt-nginx.dnp.dappnode.eth",
      version: "0.0.4",
      origin: "/ipfs/Qm1234"
    }
  ];
});

const aggregate = sinon.stub().callsFake(async () => {
  return {};
});

const resolve = sinon.stub().callsFake(() => {
  return {
    success: true,
    message: "Found compatible state",
    state: {
      "nginx-proxy.dnp.dappnode.eth": "0.0.4",
      "letsencrypt-nginx.dnp.dappnode.eth": "0.0.4",
      "web.dnp.dappnode.eth": "0.1.0"
    }
  };
});

const { default: dappGet } = proxyquire("../../../src/modules/dappGet", {
  "./aggregate": aggregate,
  "./resolve": resolve,
  "../../modules/listContainers": listContainers
});

describe("dappGet", () => {
  it("Should add packages to the alreadyUpdated object", async () => {
    const { state, alreadyUpdated } = await dappGet({
      name: "nginx-proxy.dnp.dappnode.eth",
      ver: "^0.1.0"
    });

    expect(state).to.deep.equal({
      "nginx-proxy.dnp.dappnode.eth": "0.0.4"
    });
    expect(alreadyUpdated).to.deep.equal({
      "letsencrypt-nginx.dnp.dappnode.eth": "0.0.4",
      "web.dnp.dappnode.eth": "0.1.0"
    });
  });

  it("Should call list containers once", () => {
    sinon.assert.calledOnce(listContainers);
  });
});
