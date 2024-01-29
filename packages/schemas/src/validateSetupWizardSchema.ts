import { ajv } from "./ajv.js";
import { processError } from "./utils.js";
import setupWizardSchema from "./schemas/setup-wizard.schema.json" assert { type: "json" };
import { CliError } from "./error.js";
import { SetupWizard } from "@dappnode/types";

/**
 * Validates setupWizard file with schema
 * @param setupWizard
 */
export function validateSetupWizardSchema(setupWizard: SetupWizard): void {
  const validateSetupWizard = ajv.compile(setupWizardSchema);
  const valid = validateSetupWizard(setupWizard);
  if (!valid) {
    const errors = validateSetupWizard.errors
      ? validateSetupWizard.errors.map((e) => processError(e, "setupWizard"))
      : [];
    throw new CliError(
      `Invalid setupWizard: \n${errors.map((msg) => `  - ${msg}`).join("\n")}`
    );
  }
}
