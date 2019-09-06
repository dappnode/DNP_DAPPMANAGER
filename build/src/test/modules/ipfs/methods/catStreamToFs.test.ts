import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";

const proxyquire = require("proxyquire").noCallThru();

import { testDir, createTestDir, cleanTestDir } from "../../../testUtils";

// With proxyrequire you stub before requiring

const pathSource = testDir + "/hello-world_source.txt";
const hashOk = "QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYOKOK";
const ipfs = {
  catReadableStream: (hash: string): fs.ReadStream => {
    if (hash === hashOk) return fs.createReadStream(pathSource);
    else throw Error("Unknown hash");
  },
  pin: {
    add: (data: string, callback: (err: null, res: string) => void): void => {
      callback(null, `great success: ${data}`);
    }
  }
};

const { default: catStreamToFs } = proxyquire(
  "../../../../src/modules/ipfs/methods/catStreamToFs",
  {
    "../ipfsSetup": ipfs,
    "../../../params": {
      // ##### Change this as a flag in params.ts
      CACHE_DIR: "test_files/"
    }
  }
);

describe("ipfs > methods > catStreamToFs", () => {
  before("Create test directory", createTestDir);

  // const ipfs = ipfsAPI('my.ipfs.dnp.dappnode.eth', '5001', {protocol: 'http'});
  const path = testDir + "hello-world.txt";
  const fileContents = "hello world!";

  before("Create files for the test", () => {
    fs.writeFileSync(pathSource, fileContents);
  });

  it("Should download a file", async () => {
    const onProgress = sinon.stub();
    const res = await catStreamToFs({
      hash: hashOk,
      path,
      fileSize: 1304,
      progress: (n: number): void => {
        onProgress(n);
      }
    });
    expect(res).to.be.undefined;
    expect(fs.readFileSync(path, "utf8")).to.equal(fileContents);
    // Check onProgress, since the file is so short, only the first 0% is logged
    sinon.assert.called(onProgress);
    expect(onProgress.firstCall.args).to.deep.equal([0]);
  });

  after("Clean test directory", cleanTestDir);
});
