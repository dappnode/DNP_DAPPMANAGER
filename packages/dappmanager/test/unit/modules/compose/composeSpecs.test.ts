import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { Manifest, Compose } from "@dappnode/dappnodesdk";
import { yamlParse, yamlDump } from "../../../../src/utils/yaml";
import {
  setDappnodeComposeDefaults,
  validateCompose,
  verifyCompose
} from "../../../../src/modules/compose";
import { isNotFoundError } from "../../../../src/utils/node";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specsDir = path.join(__dirname, "../releaseSpecs");

const paths = {
  manifest: "dappnode_package.json",
  compose: "docker-compose.yml",
  composeParsed: "docker-compose.parsed.yml"
};

describe("Compose specs, against real DNPs", () => {
  const files = fs.readdirSync(specsDir);
  for (const dirName of files) {
    describe(`${dirName}`, () => {
      function loadFile<T>(fileName: string): T {
        const filePath = path.join(specsDir, dirName, fileName);
        return yamlParse(fs.readFileSync(filePath, "utf8"));
      }
      function loadFileIfExists<T>(fileName: string): T | undefined {
        try {
          return loadFile<T>(fileName);
        } catch (e) {
          if (!isNotFoundError(e)) throw e;
        }
      }

      const manifest = loadFile<Manifest>(paths.manifest);
      const unsafeCompose = loadFile<Compose>(paths.compose);
      const composeParsed = loadFileIfExists<Compose>(paths.composeParsed);

      it("validateCompose", () => {
        validateCompose(unsafeCompose);
      });

      it("parseUnsafeCompose", () => {
        const safeCompose = setDappnodeComposeDefaults(unsafeCompose, manifest);
        if (!composeParsed) {
          console.log(JSON.stringify(safeCompose, null, 2));
          fs.writeFileSync(
            path.join(specsDir, dirName, paths.composeParsed),
            yamlDump(safeCompose)
          );
        } else {
          expect(safeCompose).to.deep.equal(composeParsed);
        }
      });

      it("verifyCompose", () => {
        verifyCompose(unsafeCompose);
      });
    });
  }
});
