import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { setupWizard1To2 } from "../../../../src/modules/release/parsers/setupWizardParsers";
import { SetupSchema, SetupUiJson } from "../../../../src/types-own";
import { SetupTarget, SetupWizardField } from "../../../../src/types";

const setupWizardSpecs = "./setupWizardSpecs";

/* eslint-disable @typescript-eslint/camelcase */
describe("Release > parsers > setupWizard", () => {
  describe("setupWizard1To2", () => {
    const files = fs.readdirSync(path.join(__dirname, setupWizardSpecs));
    for (const dirName of files) {
      it(`${dirName}`, () => {
        function loadFile<T>(fileName: string): T {
          const filePath = path.join(
            __dirname,
            setupWizardSpecs,
            dirName,
            fileName
          );
          if (!fs.existsSync(filePath))
            throw Error(`File ${filePath} does not exist`);
          return JSON.parse(fs.readFileSync(filePath, "utf8"));
        }

        const setupTarget = loadFile<SetupTarget>("setup-target.json");
        const setupUiJson = loadFile<SetupUiJson>("setup-ui.json");
        const setupSchema = loadFile<SetupSchema>("setup.schema.json");
        let noSetupWizard = false;
        let setupWizard: SetupWizardField[] = [];
        try {
          setupWizard = loadFile<SetupWizardField[]>("setup-wizard.json");
        } catch (e) {
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
            path.join(
              __dirname,
              setupWizardSpecs,
              dirName,
              "setup-wizard.json"
            ),
            JSON.stringify(computedSetupWizard, null, 2)
          );
        } else {
          expect(computedSetupWizard).to.deep.equal(setupWizard);
        }
      });
    }
  });
});
