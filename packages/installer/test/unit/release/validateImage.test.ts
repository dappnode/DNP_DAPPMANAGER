import "mocha";
import { expect } from "chai";
import path from "path";
import fs from "fs";
import {
  testDir,
  createTestDir,
  cleanTestDir,
} from "../../../../dappmanager/test/testUtils.js";
import { validateTarImage } from "../../../src/installer/downloadImages.js";

describe("validateTarImage", () => {
  before(async () => {
    await createTestDir();
  });

  const validXzFile = Buffer.from(
    "/Td6WFoAAATm1rRGAgAhARYAAAB0L+WjAQABMQoAAADlT7krPwkQdQABGgLcLqV+H7bzfQEAAAAABFla",
    "base64"
  );

  it("Should validate a .tar.xz file", async () => {
    const imagePath = path.join(testDir, "test-valid-xz-file.xz");
    fs.writeFileSync(imagePath, validXzFile);
    await validateTarImage(imagePath);
  });

  it("Should reject a missing file", async () => {
    const imagePath = path.join(testDir, "missing-file");
    try {
      await validateTarImage(imagePath);
      throw Error("function did not throw");
    } catch (e) {
      expect(e.message).to.include("File not found");
    }
  });

  it("Should reject an empty file", async () => {
    const imagePath = path.join(testDir, "test-empty-file.xz");
    fs.writeFileSync(imagePath, "");
    try {
      await validateTarImage(imagePath);
      throw Error("function did not throw");
    } catch (e) {
      expect(e.message).to.include("File size is 0 bytes");
    }
  });

  it("Should reject a non-xz file", async () => {
    const imagePath = path.join(testDir, "test-broken-xz-file.xz");
    fs.writeFileSync(imagePath, validXzFile + "asdububiuqbw");
    try {
      await validateTarImage(imagePath);
      throw Error("function did not throw");
    } catch (e) {
      expect(e.message).to.include(
        `Invalid .xz: Command failed: xz -t ${imagePath}\nxz: ${imagePath}: File format not recognized\n`
      );
    }
  });

  after(async () => {
    await cleanTestDir();
  });
});
