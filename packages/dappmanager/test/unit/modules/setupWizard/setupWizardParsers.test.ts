import "mocha";
import {
  SetupWizardField,
  SetupSchema,
  SetupUiJson,
  SetupTarget
} from "@dappnode/dappnodesdk";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { yamlParse, yamlDump } from "../../../../src/utils/yaml";
import { setupWizard1To2 } from "../../../../src/modules/setupWizard/setupWizard1To2";
import { isNotFoundError } from "../../../../src/utils/node";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specsDir = path.join(__dirname, "../setupWizardSpecs");

const paths = {
  setupTarget: "setup-target.json",
  setupUi: "setup-ui.json",
  setupSchema: "setup.schema.json",
  setupWizard: "setup-wizard.yml"
};

describe("Setup wizard", () => {
  describe("setupWizard1To2", () => {
    const files = fs.readdirSync(specsDir);
    for (const dirName of files) {
      it(`${dirName}`, () => {
        function loadFile<T>(fileName: string): T {
          const filePath = path.join(specsDir, dirName, fileName);
          return yamlParse(fs.readFileSync(filePath, "utf8"));
        }

        const setupTarget = loadFile<SetupTarget>(paths.setupTarget);
        const setupUiJson = loadFile<SetupUiJson>(paths.setupUi);
        const setupSchema = loadFile<SetupSchema>(paths.setupSchema);
        let noSetupWizard = false;
        let setupWizard: SetupWizardField[] = [];
        try {
          setupWizard = loadFile<SetupWizardField[]>(paths.setupWizard);
        } catch (e) {
          if (!isNotFoundError(e)) throw e;
          noSetupWizard = true;
        }

        const computedSetupWizard = setupWizard1To2(
          setupSchema,
          setupTarget,
          setupUiJson
        );

        if (noSetupWizard) {
          console.log(JSON.stringify(computedSetupWizard, null, 2));
          fs.writeFileSync(
            path.join(specsDir, dirName, paths.setupWizard),
            yamlDump(computedSetupWizard)
          );
        } else {
          expect(computedSetupWizard).to.deep.equal(setupWizard);
        }
      });
    }
  });
});
