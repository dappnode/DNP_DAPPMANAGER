const proxyquire = require("proxyquire");
const chai = require("chai");
const expect = require("chai").expect;
const sinon = require("sinon");

chai.should();

describe("Get manifest", function() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(name, params)

  const name = "test.dnp.dappnode.eth";
  const sampleHash = "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD";
  const packageReq = {
    name: name,
    ver: "0.2.1"
  };
  const manifest = {
    name,
    version: "0.1.8",
    type: "service",
    image: {
      hash: sampleHash
    }
  };

  const apmGetRepoHashSpy = sinon.spy();
  const apm = {
    getRepoHash: async packageReq => {
      apmGetRepoHashSpy(packageReq);
      return sampleHash;
    }
  };
  const downloadManifestSpy = sinon.spy();
  const downloadManifest = async _hash => {
    downloadManifestSpy(_hash);
    return manifest;
  };

  const dbInstance = {};

  const db = {
    get: async key => dbInstance[key],
    set: async (key, val) => (dbInstance[key] = val)
  };

  const getManifest = proxyquire("modules/getManifest", {
    "modules/downloadManifest": downloadManifest,
    "modules/apm": apm,
    "../db": db
  });

  let res;
  it("should call getManifest without throwing", async () => {
    res = await getManifest(packageReq);
  });

  it("should return a parsed manifest", () => {
    expect(res).to.deep.equal({
      origin: null,
      ...manifest
    });
  });

  it("should update the db", () => {
    expect(dbInstance).to.deep.equal({
      "test-dnp-dappnode-eth-0-2-1":
        "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
    });
  });
});

describe("Get manifest, test cache", function() {
  // const DOCKERCOMPOSE_PATH = getPath.dockerCompose(name, params)

  const name = "test.dnp.dappnode.eth";
  const sampleHash = "/ipfs/QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD";
  const packageReq = {
    name: name,
    ver: "latest"
  };
  const manifest = {
    name,
    version: "0.1.8",
    type: "service",
    image: {
      hash: sampleHash
    }
  };

  const apmGetRepoHashSpy = sinon.spy();
  const apm = {
    getRepoHash: async packageReq => {
      apmGetRepoHashSpy(packageReq);
      return sampleHash;
    }
  };
  const downloadManifestSpy = sinon.spy();
  const downloadManifest = async _hash => {
    downloadManifestSpy(_hash);
    return manifest;
  };

  const dbInstance = {};

  const db = {
    get: async key => dbInstance[key],
    set: async (key, val) => (dbInstance[key] = val)
  };

  const getManifest = proxyquire("modules/getManifest", {
    "modules/downloadManifest": downloadManifest,
    "modules/apm": apm,
    "../db": db
  });

  it("Should call getManifest and not store anything in the db", async () => {
    await getManifest(packageReq);
    expect(dbInstance).to.deep.equal({});
  });
});
