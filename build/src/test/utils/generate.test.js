const expect = require("chai").expect;
const params = require("params");
const fs = require("fs");
const path = require("path");

const generate = require("utils/generate");

describe("generate, utils", function() {
  describe("generate docker-compose.yml file", function() {
    /**
     * Loads all files in the ./manifestToCompose folder
     * Each file describes a case with a source manifest and a destination compose
     */
    const casesFolder = path.resolve(__dirname, "manifestToCompose");
    fs.readdirSync(casesFolder).forEach(casePath => {
      const { name, manifest, dc } = require(path.resolve(
        casesFolder,
        casePath
      ));

      it(`Case: ${name}`, () => {
        const _dc = generate.dockerCompose(manifest, params);
        expect(_dc).to.equal(dc);
      });
    });
  });

  describe("generate a manifest file", function() {
    const input = {
      key: "value"
    };
    const expectedResult = '{\n  "key": "value"\n}';

    it("should generate the expected result", () => {
      const _manifest = generate.manifest(input);
      expect(_manifest).to.equal(expectedResult);
    });
  });
});
