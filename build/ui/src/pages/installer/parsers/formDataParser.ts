import { mapValues, isEmpty } from "lodash";
import deepmerge from "deepmerge";
import Ajv from "ajv";
import {
  UserSettingsAllDnps,
  UserSettings,
  SetupTargetAllDnps,
  SetupWizardAllDnps
} from "types";
import { SetupWizardFormDataReturn } from "../types";
import { SetupSchema } from "types-own";

const ajv = new Ajv({ allErrors: true });

/**
 * Extract setup target objects from the setupWizard
 * @param setupWizard
 */
export function setupWizardToSetupTarget(
  setupWizard: SetupWizardAllDnps
): SetupTargetAllDnps {
  return mapValues(setupWizard, setupWizardDnp =>
    setupWizardDnp.fields.reduce((targets, field) => {
      return { ...targets, [field.id]: field.target };
    }, {})
  );
}

/**
 * Iterate the formData and find if there's a definition for that property
 * in the setupSchema. If so, use the target to add the setting in the correct
 * property of userSettings
 *
 * @param formData
 * @param setupSchema
 * @return userSettings
 */
export function formDataToUserSettings(
  formData: SetupWizardFormDataReturn,
  setupTarget: SetupTargetAllDnps
): UserSettingsAllDnps {
  return mapValues(formData, (formDataDnp, dnpName) => {
    const userSettings: UserSettings = {};
    const targets = setupTarget[dnpName];
    if (!targets) return {};

    for (const [propId, value] of Object.entries(formDataDnp)) {
      const target = targets[propId];
      if (target && target.type)
        switch (target.type) {
          case "environment":
            const envValue = value;
            if (target.name)
              userSettings.environment = deepmerge(
                userSettings.environment || {},
                { [target.name]: envValue }
              );
            break;

          case "portMapping":
            const hostPort = value;
            if (target.containerPort)
              userSettings.portMappings = deepmerge(
                userSettings.portMappings || {},
                { [target.containerPort]: hostPort }
              );
            break;

          case "namedVolumeMountpoint": {
            const mountpointHostPath = value;
            if (target.volumeName)
              userSettings.namedVolumeMountpoints = deepmerge(
                userSettings.namedVolumeMountpoints || {},
                { [target.volumeName]: mountpointHostPath }
              );
            break;
          }

          case "allNamedVolumesMountpoint": {
            const mountpointHostPath = value;
            userSettings.allNamedVolumeMountpoint = mountpointHostPath;
            break;
          }

          case "fileUpload":
            const fileDataUrl = value;
            if (target.path)
              userSettings.fileUploads = deepmerge(
                userSettings.fileUploads || {},
                { [target.path]: fileDataUrl }
              );
            break;
        }
    }
    return userSettings;
  });
}

/**
 * For each property defined in the setup schema, check if there is
 * a corresponding user setting (by looking at its target), and if so,
 * append it to the formData object
 *
 * @param userSettingsAllDnps
 * @param setupSchema
 * @return formData
 */
export function userSettingsToFormData(
  userSettingsAllDnps: UserSettingsAllDnps,
  setupTarget: SetupTargetAllDnps
): SetupWizardFormDataReturn {
  return mapValues(setupTarget, (targets, dnpName) => {
    const userSettings = userSettingsAllDnps[dnpName];
    if (!userSettings || !targets) return {};
    const {
      environment = {},
      portMappings = {},
      namedVolumeMountpoints = {},
      allNamedVolumeMountpoint = "",
      fileUploads = {}
    } = userSettings;
    const formDataDnp: { [propId: string]: string } = {};

    for (const [propId, target] of Object.entries(targets)) {
      if (target && target.type) {
        switch (target.type) {
          case "environment":
            const { name } = target;
            if (name && name in environment)
              formDataDnp[propId] = environment[name];
            break;

          case "portMapping":
            const { containerPort } = target;
            if (containerPort && containerPort in portMappings)
              formDataDnp[propId] = portMappings[containerPort];
            break;

          case "namedVolumeMountpoint": {
            const { volumeName } = target;
            if (volumeName && volumeName in namedVolumeMountpoints)
              formDataDnp[propId] = namedVolumeMountpoints[volumeName];
            break;
          }

          case "allNamedVolumesMountpoint": {
            formDataDnp[propId] = allNamedVolumeMountpoint;
            break;
          }

          case "fileUpload":
            const { path } = target;
            if (path && path in fileUploads)
              formDataDnp[propId] = fileUploads[path];
            break;
        }
      }
    }
    return formDataDnp;
  });
}

/**
 * Filter by only the active fields according to their provided rules
 * and the current values of the setupWizard
 * @param formData
 * @param setupWizard
 */
export function filterActiveSetupWizard(
  setupWizard: SetupWizardAllDnps,
  formData: SetupWizardFormDataReturn
): SetupWizardAllDnps {
  return mapValues(setupWizard, (setupWizardDnp, dnpName) => ({
    ...setupWizardDnp,
    fields: setupWizardDnp.fields.filter(field => {
      if (field.if) {
        try {
          return ajv.validate(correctJsonSchema(field.if), formData[dnpName]);
        } catch (e) {
          console.log(`Validation error ${dnpName} ${field.id}`, e);
          return false;
        }
      } else {
        return true;
      }
    })
  }));
}

/**
 * Utility to enforce a correct JSON schema syntax
 * Maybe the user has not used a proper JSON schema.
 * field.if MUST be = { type: "object", properties: {...} }
 * If it doesn't follow this structure, it will be forced
 * @param schemaOrProperties
 */
function correctJsonSchema(schemaOrProperties: any): SetupSchema {
  if (typeof schemaOrProperties.properties === "object") {
    const schema = schemaOrProperties;
    return {
      type: "object",
      ...schema
    };
  } else {
    const properties = schemaOrProperties;
    return {
      type: "object",
      properties,
      required: Object.keys(properties)
    };
  }
}

/**
 * Check if the entire setupWizard is empty or has 0 fields
 * @param setupWizard
 */
export function isSetupWizardEmpty(setupWizard?: SetupWizardAllDnps): boolean {
  return (
    !setupWizard ||
    isEmpty(setupWizard) ||
    Object.values(setupWizard).every(
      setupWizardDnp => isEmpty(setupWizardDnp) || !setupWizardDnp.fields.length
    )
  );
}
