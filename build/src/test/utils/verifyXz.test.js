const expect = require("chai").expect;

const verifyXz = require("utils/verifyXz");
const shell = require("utils/shell");

const testDirectory = "./test_files/";
const okFilePath = `${testDirectory}ok-file.txt.xz`;
const okFilePreCompress = okFilePath.replace(".xz", "");
const corruptFilePath = `${testDirectory}corrupt-file.txt.xz`;
const missingFilePath = `${testDirectory}missing-file.txt.xz`;

async function cleanFiles() {
  for (const path of [okFilePath, okFilePreCompress, corruptFilePath]) {
    await shell(`rm -f ${path}`);
  }
}

describe("Util: verifyXz", function() {
  before(async () => {
    await cleanFiles();
    await shell(`echo "some content" > ${okFilePreCompress}`);
    await shell(`xz ${okFilePreCompress}`);
    await shell(`echo "bad content" > ${corruptFilePath}`);
  });

  it("okFilePath should be OK", async () => {
    const result = await verifyXz(okFilePath);
    expect(result.success).equal(true);
  });

  it("corruptFilePath should NOT be ok", async () => {
    const result = await verifyXz(corruptFilePath);
    expect(result.success).equal(false);
    expect(result.message).to.include("File format not recognized");
  });

  it("missingFilePath should NOT be ok", async () => {
    const result = await verifyXz(missingFilePath);
    expect(result.success).equal(false);
    expect(result.message).to.include("No such file or directory");
  });

  after(async () => {
    await cleanFiles();
  });
});
