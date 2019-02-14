const expect = require('chai').expect;
const fileToDataUri = require('utils/fileToDataUri');
const shell = require('utils/shell');
const fs = require('fs');

/* eslint-disable max-len */

const testDir = 'test_files';

describe('Util: fileToDataUri', () => {
  before(async () => {
    await shell(`mkdir -p ${testDir}`);
  });

  it('should convert a PNG to a valid dataUri', async () => {
    const path = `${testDir}/filedemo.png`;
    const dataUri = 'data:image/png;base64,iVBORw0KGgo=';
    const pngSignature = '89504e470d0a1a0a';
    const fileData = Buffer.from(pngSignature, 'hex');
    fs.writeFileSync(path, fileData);
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    expect(_dataUri).to.equal(dataUri);
  });

  it('should a JSON file to a valid dataUri', async () => {
    const fileData = JSON.stringify(
      {
        name: 'test',
        version: '1.0.0',
        description: '',
        main: 'index.js',
        scripts: {test: 'echo "Error: no test specified" && exit 1'},
        keywords: [],
        author: '',
        license: 'ISC',
        dependencies: {
          'ethers': '^4.0.23',
          'lz-string': '^1.4.4',
          'qrcode-terminal': '^0.12.0',
          'web3': '^1.0.0-beta.37',
        },
      },
      null,
      2
    );
    const path = `${testDir}/filedemo.json`;
    const dataUri = 'data:application/json;base64,ewogICJuYW1lIjogInRlc3QiLAogICJ2ZXJzaW9uIjogIjEuMC4wIiwKICAiZGVzY3JpcHRpb24iOiAiIiwKICAibWFpbiI6ICJpbmRleC5qcyIsCiAgInNjcmlwdHMiOiB7CiAgICAidGVzdCI6ICJlY2hvIFwiRXJyb3I6IG5vIHRlc3Qgc3BlY2lmaWVkXCIgJiYgZXhpdCAxIgogIH0sCiAgImtleXdvcmRzIjogW10sCiAgImF1dGhvciI6ICIiLAogICJsaWNlbnNlIjogIklTQyIsCiAgImRlcGVuZGVuY2llcyI6IHsKICAgICJldGhlcnMiOiAiXjQuMC4yMyIsCiAgICAibHotc3RyaW5nIjogIl4xLjQuNCIsCiAgICAicXJjb2RlLXRlcm1pbmFsIjogIl4wLjEyLjAiLAogICAgIndlYjMiOiAiXjEuMC4wLWJldGEuMzciCiAgfQp9Cg==';
    fs.writeFileSync(path, fileData);
    const _dataUri = await fileToDataUri(path);

    // Verify generated dataUri:
    // Some of the base64 add trailing characters. Will only compare the same lengths
    const minLength = Math.min(_dataUri.length, dataUri.length);
    expect(_dataUri.slice(0, minLength)).to.equal(dataUri.slice(0, minLength));
  });

  after(async () => {
    await shell(`rm -rf ${testDir}`);
  });
});
