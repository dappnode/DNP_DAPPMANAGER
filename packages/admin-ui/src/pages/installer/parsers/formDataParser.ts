import { mapValues, isEmpty } from "lodash-es";
import deepmerge from "deepmerge";
import Ajv from "ajv";
import {
  UserSettingsAllDnps,
  UserSettings,
  SetupWizardAllDnps
} from "@dappnode/common";
import { SetupWizardFormDataReturn } from "../types";
import { SetupSchema } from "@dappnode/dappnodesdk";
import { SetupTargetAllDnps } from "types";

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
 * @returns userSettings
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
              /**
               * deepmerge function joins the properties of two objects
               * In this case, it creates the property service from a string or an array and the object which defines
               * the environment variable value
               * */

              userSettings.environment = deepmerge(
                userSettings.environment || {},
                getServicesNames(target.service || dnpName, {
                  [target.name]: envValue
                })
              );
            break;

          case "portMapping":
            const hostPort = value;
            if (target.containerPort)
              userSettings.portMappings = deepmerge(
                userSettings.portMappings || {},
                {
                  [target.service || dnpName]: {
                    [target.containerPort]: hostPort
                  }
                }
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
                { [target.service || dnpName]: { [target.path]: fileDataUrl } }
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
 * @returns formData
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
            const serviceNames = target.service || dnpName;
            /**
             * The following loop check if the field service is an array or a string in order to
             * define an environment object with its properties
             *
             */
            for (let service of Array.isArray(serviceNames)
              ? serviceNames
              : [serviceNames]) {
              const environmentService = environment[service];

              if (hasProperty(target.name, environmentService))
                formDataDnp[propId] = environmentService[target.name];
            }
            break;

          case "portMapping":
            const portMappingsService = portMappings[target.service || dnpName];
            if (hasProperty(target.containerPort, portMappingsService))
              formDataDnp[propId] = portMappingsService[target.containerPort];
            break;

          case "namedVolumeMountpoint": {
            if (hasProperty(target.volumeName, namedVolumeMountpoints))
              formDataDnp[propId] = namedVolumeMountpoints[target.volumeName];
            break;
          }

          case "allNamedVolumesMountpoint": {
            formDataDnp[propId] = allNamedVolumeMountpoint;
            break;
          }

          case "fileUpload":
            const fileUploadsService = fileUploads[target.service || dnpName];
            if (hasProperty(target.path, fileUploadsService))
              formDataDnp[propId] = fileUploadsService[target.path];
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
          console.error(`Validation error ${dnpName} ${field.id}`, e);
          return false;
        }
      } else {
        return true;
      }
    })
  }));
}

/**
 * Util: Type-safe wrapper around `key in obj` which will be ok whatever type obj is
 */
function hasProperty(
  key: string,
  obj: { [key: string]: string } | undefined
): boolean {
  return Boolean(key && obj && key in obj);
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

/**
 * It's a type to create a dynamic way the environment object which is contained in UserSettingTarget
 *
 */

interface EnvVarObject<T> {
  [key: string]: T;
}

/**
 * The getServicesNames purpose is creating an environment object (it's contained
 * in UserSettingTarget) receiving an array with the name of the services use the
 * environment variable or a string
 *
 *  @param serviceNames
 *  @param envValue
 *  @returns EnvVarObject
 */

function getServicesNames<T>(
  serviceNames: string | string[],
  envValue: T
): EnvVarObject<T> {
  let envObj: EnvVarObject<T> = {};
  for (let service of Array.isArray(serviceNames)
    ? serviceNames
    : [serviceNames]) {
    envObj[service] = envValue;
  }
  return envObj;
}
