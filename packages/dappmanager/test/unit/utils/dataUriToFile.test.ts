import "mocha";
import { expect } from "chai";
import fs from "fs";

import dataUriToFile from "../../../src/utils/dataUriToFile.js";
import { cleanTestDir, createTestDir } from "../../testUtils.js";

const testDir = "test_files";

describe("Util: dataUriToFile", () => {
  before(async () => {
    await createTestDir();
  });

  it("should convert a PNG dataUri to a valid image", () => {
    const pathTo = `${testDir}/filedemo.png`;
    const dataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8AARAwMjDAGACwBA/9IB8FMAAAAAElFTkSuQmCC";
    dataUriToFile(dataUri, pathTo);

    // Verify written file
    const dataBuffer = fs.readFileSync(pathTo);
    // Check PNG signature
    const pngSignature = "89504e470d0a1a0a";
    // Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48
    expect(dataBuffer.toString("hex").slice(0, pngSignature.length)).to.equal(
      pngSignature
    );
  });

  it("should convert a JSON dataUri a valid json file", () => {
    const pathTo = `${testDir}/filedemo.json`;
    const dataUri =
      "data:application/json;base64,ewogICJuYW1lIjogIkFkYW0iLAogICJhZ2UiOiAyMwp9Cg==";
    dataUriToFile(dataUri, pathTo);

    // Verify written file
    const jsonData = JSON.parse(fs.readFileSync(pathTo, "utf8"));
    expect(jsonData).to.deep.equal({
      name: "Adam",
      age: 23
    });
  });

  after(async () => {
    await cleanTestDir();
  });
});
