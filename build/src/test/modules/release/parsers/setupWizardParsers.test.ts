import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

import { setupWizard1To2 } from "../../../../src/modules/release/parsers/setupWizardParsers";
import { SetupSchema, SetupUiJson } from "../../../../src/types-own";
import { SetupTarget, SetupWizardField } from "../../../../src/types";

const setupWizardSpecs = "./setupWizardSpecs";

const paths = {
  setupTarget: "setup-target.json",
  setupUi: "setup-ui.json",
  setupSchema: "setup.schema.json",
  setupWizard: "setup-wizard.yml"
};

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
          return yaml.safeLoad(fs.readFileSync(filePath, "utf8"));
        }

        const setupTarget = loadFile<SetupTarget>(paths.setupTarget);
        const setupUiJson = loadFile<SetupUiJson>(paths.setupUi);
        const setupSchema = loadFile<SetupSchema>(paths.setupSchema);
        let noSetupWizard = false;
        let setupWizard: SetupWizardField[] = [];
        try {
          setupWizard = loadFile<SetupWizardField[]>(paths.setupWizard);
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
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
            path.join(__dirname, setupWizardSpecs, dirName, paths.setupWizard),
            yaml.safeDump(computedSetupWizard)
          );
        } else {
          expect(computedSetupWizard).to.deep.equal(setupWizard);
        }
      });
    }
  });
});
