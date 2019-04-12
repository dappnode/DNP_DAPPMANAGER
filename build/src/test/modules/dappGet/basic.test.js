const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const sinon = require("sinon");

/**
 * Purpose of the test. Make sure dappGetBasic works
 * This is a lite version of the dappGet, specially though for core updates
 */

const dockerList = {
  listContainers: sinon.stub().callsFake(async () => {
    return [
      { name: "dappmanager.dnp.dappnode.eth", version: "0.1.10" },
      { name: "admin.dnp.dappnode.eth", version: "0.1.6" },
      { name: "ethforward.dnp.dappnode.eth", version: "0.1.0" }
    ];
  })
};

const getManifest = sinon.stub().callsFake(async () => {
  return {
    name: "core.dnp.dappnode.eth",
    version: "0.1.0",
    type: "dncore",
    dependencies: {
      "bind.dnp.dappnode.eth": "0.1.4",
      "ipfs.dnp.dappnode.eth": "0.1.3",
      "ethchain.dnp.dappnode.eth": "0.1.4",
      "ethforward.dnp.dappnode.eth": "0.1.1",
      "vpn.dnp.dappnode.eth": "0.1.11",
      "wamp.dnp.dappnode.eth": "0.1.0",
      "admin.dnp.dappnode.eth": "0.1.6",
      "dappmanager.dnp.dappnode.eth": "0.1.10"
    }
  };
});

const dappGet = proxyquire("modules/dappGet/basic", {
  "modules/getManifest": getManifest,
  "modules/dockerList": dockerList
});

describe("dappGetBasic", () => {
  it("Resolve the request only fetching first level dependencies", async () => {
    const { state } = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.1.0"
    });
    expect(state).to.deep.equal({
      "core.dnp.dappnode.eth": "0.1.0",
      "bind.dnp.dappnode.eth": "0.1.4",
      "ipfs.dnp.dappnode.eth": "0.1.3",
      "ethchain.dnp.dappnode.eth": "0.1.4",
      "ethforward.dnp.dappnode.eth": "0.1.1",
      "vpn.dnp.dappnode.eth": "0.1.11",
      "wamp.dnp.dappnode.eth": "0.1.0"
      // 'admin.dnp.dappnode.eth': '0.1.6',
      // 'dappmanager.dnp.dappnode.eth': '0.1.10',
    });
  });

  it("Should call list containers once", () => {
    sinon.assert.calledOnce(dockerList.listContainers);
  });
});
