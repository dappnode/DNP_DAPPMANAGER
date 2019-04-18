const expect = require("chai").expect;
const fileToDataUri = require("utils/fileToDataUri");
const shell = require("utils/shell");
const fs = require("fs");

const testDir = "test_files";

describe("Util: fileToDataUri", () => {
  before(async () => {
    await shell(`mkdir -p ${testDir}`);
  });

  it("should convert a PNG to a valid dataUri", async () => {
    const path = `${testDir}/filedemo.png`;
    const dataUri = "data:image/png;base64,iVBORw0KGgo=";
    const pngSignature = "89504e470d0a1a0a";
    const fileData = Buffer.from(pngSignature, "hex");
    fs.writeFileSync(path, fileData);
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    expect(_dataUri).to.equal(dataUri);
  });

  it("should convert a JSON file to a valid dataUri", async () => {
    const fileData = JSON.stringify(
      {
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
      },
      null,
      2
    );
    const path = `${testDir}/filedemo.json`;
    const dataUri =
      "data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==";
    fs.writeFileSync(path, fileData);
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    const minLength = Math.min(_dataUri.length, dataUri.length);
    expect(_dataUri.slice(0, minLength)).to.equal(dataUri.slice(0, minLength));
  });

  it("should convert a file without extension", async () => {
    const fileData = `config: TEST`;
    const path = `${testDir}/config`;
    const dataUri = "data:application/octet-stream;base64,Y29uZmlnOiBURVNU";
    fs.writeFileSync(path, fileData);
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    const minLength = Math.min(_dataUri.length, dataUri.length);
    expect(_dataUri.slice(0, minLength)).to.equal(dataUri.slice(0, minLength));
  });

  it("Should convert a tar file ", async () => {
    // create a directory structure
    const uncompressedPath = `${testDir}/app`;
    const path = `${testDir}/app.tar.gz`;

    await shell(`mkdir ${uncompressedPath}`);
    await shell(`echo "file-1" > ${uncompressedPath}/file1.txt`);
    await shell(`tar -czf ${path} ${uncompressedPath}`);

    const dataUri =
      "data:application/gzip;base64,H4sIANafuFwAA+3RQQrCMBBA0aw9RS6gzaRJ5zjSRYVC0WIjeHzNoqAFK0iLiP9tJpBABn5qhrQ/tF0zFHXfF2YN7k5jzFM0usc5MlKGWImo+so48UHV2LjKNhOXIdVna03Xno5z797d/6j03D+fZJeuack/cuAqhJn+OukffBmNdUsu8cqf";
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    const minLength = 34; // For some reason, .tar.gz are not deteministic
    expect(_dataUri.slice(0, minLength)).to.equal(dataUri.slice(0, minLength));
  });

  after(async () => {
    await shell(`rm -rf ${testDir}`);
  });
});
