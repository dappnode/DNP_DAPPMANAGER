import fs from "fs";
import path from "path";
import { expect } from "chai";
import { ipfs } from "@dappnode/ipfs";
import { cleanTestDir, testDir } from "../../../testUtils.js";
import { ipfsAddAll } from "../../../integration/testIpfsUtils.js";

describe("ipfs / integration test", function () {
  this.timeout(60 * 1000);

  const dirPath = path.join(testDir, "ipfs-test-upload");
  const filepath = path.join(dirPath, "sample.txt");
  const filePathResult = path.join(testDir, "sample-result.txt");
  const fileContents = "sample-contents";

  let dirHash: string;
  let fileHash: string;

  before("Prepare directory", () => {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filepath, fileContents);
  });

  after("Clean test dir", async () => {
    await cleanTestDir();
  });

  it("Upload directory", async () => {
    const addResults = await ipfsAddAll(dirPath);
    dirHash =
      addResults
        .find(addResult => addResult.path === "test_files/ipfs-test-upload")
        ?.cid.toString() || "";
    if (!dirHash) throw Error("No directory hash found");
  });

  it("List directory files", async () => {
    const files = await ipfs.list(dirHash);

    expect(files.map(file => file.name)).to.deep.equal([
      path.parse(filepath).base
    ]);
    fileHash = files[0].cid.toString();
  });

  it("Download file to FS", async () => {
    await ipfs.writeFileToFs({ hash: fileHash, path: filePathResult });
    const result = fs.readFileSync(filePathResult, "utf8");
    expect(result).to.equal(fileContents, "Wrong downloaded file contents");
  });

  it("Download file to memory", async () => {
    const result = await ipfs.writeFileToMemory(fileHash);
    expect(result).to.equal(fileContents, "Wrong downloaded file contents");
  });

  it("Pin file", async () => {
    await ipfs.pinAdd(fileHash);
  });

  it("objectSize", async () => {
    const data = await ipfs.objectGet(dirHash);
    expect(data.Data?.length).to.be.a("number");
  });
});

describe("ipfs / hash format", () => {
  // Hashes for the getting started page
  const content = "Hello and Welcome to IPFS!";
  const hashes = [
    "/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
    "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/readme",
    "/ipfs/QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB",
    "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB"
  ];

  for (const hash of hashes) {
    it(`Should download getting started page from ${hash}`, async () => {
      const data = await ipfs.writeFileToMemory(hash);
      expect(data).to.include(content);
    });
  }
});
