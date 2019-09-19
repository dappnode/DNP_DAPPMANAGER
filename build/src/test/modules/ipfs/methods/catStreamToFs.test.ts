import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import { testDir, createTestDir, cleanTestDir } from "../../../testUtils";
import rewiremock from "rewiremock";
// Import for type
import catStreamToFsType from "../../../../src/modules/ipfs/methods/catStreamToFs";

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

describe("ipfs > methods > catStreamToFs", () => {
  before("Create test directory", async () => {
    await createTestDir();
  });

  let catStreamToFs: typeof catStreamToFsType;

  before("Mock", async () => {
    const mock = await rewiremock.around(
      () => import("../../../../src/modules/ipfs/methods/catStreamToFs"),
      mock => {
        mock(() => import("../../../../src/modules/ipfs/ipfsSetup"))
          .withDefault(ipfs)
          .toBeUsed();
      }
    );
    catStreamToFs = mock.default;
  });

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

  after("Clean test directory", async () => {
    await cleanTestDir();
  });
});
