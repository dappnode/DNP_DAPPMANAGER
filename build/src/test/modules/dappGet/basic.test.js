const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const sinon = require("sinon");

/**
 * Purpose of the test. Make sure dappGetBasic works
 * This is a lite version of the dappGet, specially though for core updates
 */

const dnpList = getDnpList();
const dockerList = {
  listContainers: sinon.stub().callsFake(async () => {
    return dnpList;
  })
};

const coreDnpManifest = getCoreDnpManifest();
const getManifest = sinon.stub().callsFake(async () => {
  return coreDnpManifest;
});

const dappGet = proxyquire("modules/dappGet/basic", {
  "modules/getManifest": getManifest,
  "modules/dockerList": dockerList
});

describe("dappGetBasic", () => {
  let result;
  it("Resolve the request only fetching first level dependencies", async () => {
    result = await dappGet({
      name: "core.dnp.dappnode.eth",
      ver: "0.1.0"
    });
    expect(result).to.deep.equal({
      success: {
        "core.dnp.dappnode.eth": "0.1.0",
        "bind.dnp.dappnode.eth": "0.1.4",
        "ipfs.dnp.dappnode.eth": "0.1.3",
        "ethchain.dnp.dappnode.eth": "0.1.4",
        "ethforward.dnp.dappnode.eth": "0.1.1",
        "vpn.dnp.dappnode.eth": "0.1.11",
        "wamp.dnp.dappnode.eth": "0.1.0"
        // 'admin.dnp.dappnode.eth': '0.1.6',
        // 'dappmanager.dnp.dappnode.eth': '0.1.10',
      }
    });
  });

  it("Should call list containers once", () => {
    sinon.assert.calledOnce(dockerList.listContainers);
  });
});

function getDnpList() {
  return [
    {
      name: "dappmanager.dnp.dappnode.eth",
      version: "0.1.10"
    },
    {
      name: "admin.dnp.dappnode.eth",
      version: "0.1.6"
    },
    {
      name: "ethforward.dnp.dappnode.eth",
      version: "0.1.0"
    }
  ];
}

function getCoreDnpManifest() {
  return {
    name: "core.dnp.dappnode.eth",
    version: "0.1.0",
    description: "Dappnode package responsible for manage the core packages",
    avatar: "/ipfs/QmQWed5zepncXHvDHt5dZipjVcU7vyydxHmVJV5MF6Wwhr",
    type: "dncore",
    image: {
      path: "core.dnp.dappnode.eth_0.1.0.tar.xz",
      hash: "/ipfs/Qmf2TmqcKk3stw1zt6wzkDW5UrKTCgXNx3k2m5ftr3dip2",
      size: 19346978,
      volumes: [
        "/usr/src/dappnode/DNCORE/:/usr/src/app/DNCORE/",
        "/var/run/docker.sock:/var/run/docker.sock"
      ],
      subnet: "172.33.0.0/16",
      ipv4_address: "172.33.1.10"
    },
    author: "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)",
    keywords: ["DAppNodeCore"],
    homepage: {
      homepage: "https://github.com/dappnode/DNP_CORE#readme"
    },
    repository: {
      type: "git",
      url: "https://github.com/dappnode/DNP_CORE"
    },
    bugs: {
      url: "https://github.com/dappnode/DNP_CORE/issues"
    },
    license: "GPL-3.0",
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
}
