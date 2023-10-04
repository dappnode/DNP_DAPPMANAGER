import "mocha";
import { expect } from "chai";
import { shell } from "@dappnode/utils";
import path from "path";
import { createTestDir, cleanTestDir, testDir } from "../../testUtils.js";

import verifyXz from "../../../src/utils/verifyXz.js";

const okFilePath = path.join(testDir, "ok-file.txt.xz");
const okFilePreCompress = okFilePath.replace(".xz", "");
const corruptFilePath = path.join(testDir, "corrupt-file.txt.xz");
const missingFilePath = path.join(testDir, "missing-file.txt.xz");

describe("Util: verifyXz", function () {
  before(async () => {
    await createTestDir();
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
    await cleanTestDir();
  });
});
