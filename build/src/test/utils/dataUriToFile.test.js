const expect = require("chai").expect;
const dataUriToFile = require("utils/dataUriToFile");
const shell = require("utils/shell");
const fs = require("fs");

const testDir = "test_files";

describe("Util: dataUriToFile", () => {
  before(async () => {
    await shell(`mkdir -p ${testDir}`);
  });

  it("should convert a PNG dataUri to a valid image", () => {
    const pathTo = `${testDir}/filedemo.png`;
    const dataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAclBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC0BbqFAAAAJXRSTlMAQlPY1fea7TMXsw/guqHKpyoD28MMOc/8hT/zXkkJwAaP5CFsRNqakwAAAPlJREFUSMft1cmSgjAUhWGmJMg8KeDY2v7v/4ouVETKSoKrri7O7qbykdwUBMdZsuTLbPpcIPJ+YwvKlGfS0kp4O17ZeTYCgERKmQBgNqUA2nsTbgAI495SoPh5FMcUSA1iC1zioVwpYKsnEnBH9R6QeuJDMK4rBb6eCMjeBiIQWrEGzm8jGbDWkar7sEpXaZepIZn2Uut7KSYn5gGFnrhAexzKuJ484lMaIHr2G5+AxvTChALwD/ddJQDBymT2AKhIRgoAMJtrxyRm47bD5JOyNM7hnCuSpg+d0NqMjuN74/9hkzvzTTzbZPNu6fDyuqpsE/8uf7d/nBt9lCKWEAOw/QAAAABJRU5ErkJggg==";
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
      "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==";
    dataUriToFile(dataUri, pathTo);

    // Verify written file
    const jsonData = JSON.parse(fs.readFileSync(pathTo, "utf8"));
    expect(jsonData).to.deep.equal({
      name: "test",
      version: "1.0.0",
      description: "",
      main: "index.js",
      scripts: { test: 'echo "Error: no test specified" && exit 1' },
      keywords: [],
      author: "",
      license: "ISC",
      dependencies: {
        ethers: "^4.0.23",
        "lz-string": "^1.4.4",
        "qrcode-terminal": "^0.12.0",
        web3: "^1.0.0-beta.37"
      }
    });
  });

  after(async () => {
    await shell(`rm -rf ${testDir}`);
  });
});
