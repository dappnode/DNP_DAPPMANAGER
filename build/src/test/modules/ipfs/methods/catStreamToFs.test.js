const proxyquire = require("proxyquire");
const expect = require("chai").expect;
const sinon = require("sinon");
const fs = require("fs");
const { testDir, createTestDir, cleanTestDir } = require("../../../testUtils");

// With proxyrequire you stub before requiring

const pathSource = testDir + "/hello-world_source.txt";
const hashOk = "QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYOKOK";
const ipfs = {
  catReadableStream: hash => {
    if (hash === hashOk) return fs.createReadStream(pathSource);
    else throw Error("Unknown hash");
  },
  pin: {
    add: (_, callback) => {
      callback(null, "great success");
    }
  }
};

// Define test parameters
const params = {
  CACHE_DIR: "test_files/"
};

const catStreamToFs = proxyquire("modules/ipfs/methods/catStreamToFs", {
  "../ipfsSetup": ipfs,
  params: params
});

describe("ipfs > methods > catStreamToFs", () => {
  before("Create test directory", createTestDir);

  // const ipfs = ipfsAPI('my.ipfs.dnp.dappnode.eth', '5001', {protocol: 'http'});
  const path = testDir + "hello-world.txt";
  const fileContents = "hello world!";

  before("Create files for the test", () => {
    fs.writeFileSync(pathSource, fileContents);
  });

  it("Should download a file", async () => {
    const onChunk = sinon.stub();
    const res = await catStreamToFs(hashOk, path, { onChunk });
    expect(res).to.be.undefined;
    expect(fs.readFileSync(path, "utf8")).to.equal(fileContents);
    // Check onChunk
    sinon.assert.called(onChunk);
    const chunk = onChunk.firstCall.lastArg;
    expect(chunk instanceof Buffer);
    expect(String(chunk)).to.equal(fileContents);
  });

  after("Clean test directory", cleanTestDir);
});
