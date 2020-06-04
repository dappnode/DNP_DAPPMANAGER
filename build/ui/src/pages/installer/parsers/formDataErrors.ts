import { UserSettingsAllDnps, SetupWizardAllDnps } from "types";
import { SetupWizardFormDataReturn } from "../types";
import {
  MOUNTPOINT_DEVICE_LEGACY_TAG,
  USER_SETTING_DISABLE_TAG
} from "../../../params";

type SetupWizardErrorType = "empty" | "pattern" | "enum";
export interface SetupWizardError {
  dnpName: string;
  id: string;
  title: string;
  type: SetupWizardErrorType;
  message: string;
}

/* eslint-disable-next-line no-useless-escape */
const isAbsolute = (path: string) => /^\/[^\/]+/.test(path);

/**
 * Enforces rules on user settings:
 * - namedVolumeMountpoints: must be absolute paths. Renaming for a different named volume is not allowed
 */
export function getUserSettingsDataErrors(
  dataAllDnps: UserSettingsAllDnps
): string[] {
  const errors: string[] = [];
  for (const [dnpName, data] of Object.entries(dataAllDnps)) {
    if (data.namedVolumeMountpoints) {
      for (const [volName, volPath] of Object.entries(
        data.namedVolumeMountpoints
      )) {
        if (
          volPath &&
          !(
            isAbsolute(volPath) ||
            volPath.startsWith(MOUNTPOINT_DEVICE_LEGACY_TAG) ||
            volPath.startsWith(USER_SETTING_DISABLE_TAG)
          )
        )
          errors.push(
            `Mountpoint path for '${dnpName}' '${volName}' must be an absolute path`
          );
      }
    }
  }
  return errors;
}

/**
 * Do data validation on the setup wizard form data
 * @param setupWizard
 * @param formData
 */
export function parseSetupWizardErrors(
  setupWizard: SetupWizardAllDnps,
  formData: SetupWizardFormDataReturn
): SetupWizardError[] {
  const dataErrors: SetupWizardError[] = [];
  for (const [dnpName, setupWizardDnp] of Object.entries(setupWizard)) {
    for (const field of setupWizardDnp.fields) {
      const value =
        (formData[dnpName] ? formData[dnpName][field.id] : "") || "";
      const addError = (type: SetupWizardErrorType, message: string) =>
        dataErrors.push({
          dnpName,
          id: field.id,
          title: field.title,
          type,
          message
        });
      if (!value || value === "") {
        if (field.required) addError("empty", "is required");
      } else if (field.enum) {
        if (!field.enum.includes(value)) {
          addError("enum", `must be one of: ${field.enum.join(", ")}`);
        }
      } else if (field.pattern) {
        const regExp = new RegExp(field.pattern);
        if (!regExp.test(value))
          if (field.patternErrorMessage)
            addError("pattern", field.patternErrorMessage);
          else addError("pattern", `Must match pattern '${field.pattern}'`);
      }
    }
  }
  return dataErrors;
}
