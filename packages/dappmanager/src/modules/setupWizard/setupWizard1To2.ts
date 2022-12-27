import { pick, omit, uniq, isEmpty } from "lodash-es";
import deepmerge from "deepmerge";
import {
  SetupWizard,
  SetupSchema,
  SetupWizardField,
  SetupUiJson,
  SetupTarget
} from "@dappnode/dappnodesdk";

/**
 * Format setup wizard v1 files as a unique setup wizard v2 object
 * Adds the dependencies with a conditional schema block
 * if dependencies[propId].oneOf structure is used
 * @param setupSchema
 * @param setupTarget
 * @param setupUiJson
 */
export function setupWizard1To2(
  setupSchema: SetupSchema,
  setupTarget: SetupTarget,
  setupUiJson: SetupUiJson
): SetupWizard {
  const setupWizardObj: { [propId: string]: SetupWizardField } = {};

  function addPropertiesBlock(
    properties: { [k: string]: SetupSchema },
    required: string[],
    ifSchema?: SetupSchema
  ): void {
    for (const [propId, propValues] of Object.entries(properties)) {
      setupWizardObj[propId] = {
        ...(setupWizardObj[propId] || {}),
        title: propValues.title || propId,
        description: propValues.description || "",
        ...pick(propValues, ["pattern"])
      };
      // Set ID
      setupWizardObj[propId].id = propId;

      // Add optional properties
      if (setupTarget[propId])
        setupWizardObj[propId].target = setupTarget[propId];
      if (Array.isArray(propValues.enum))
        setupWizardObj[propId].enum = mergeEnum(
          setupWizardObj[propId].enum || [],
          propValues.enum,
          propValues.default
        );
      if (ifSchema)
        setupWizardObj[propId].if = mergeIfSchema(
          setupWizardObj[propId].if || {},
          ifSchema
        );
      if (
        typeof propValues.customErrors === "object" &&
        propValues.customErrors.pattern
      )
        setupWizardObj[propId].patternErrorMessage =
          propValues.customErrors.pattern;
      if (required && required.includes(propId))
        setupWizardObj[propId].required = true;
      if (
        typeof setupUiJson[propId] === "object" &&
        setupUiJson[propId]["ui:widget"] === "password"
      )
        setupWizardObj[propId].secret = true;
    }
  }

  // Add the main block of properties
  if (setupSchema.properties)
    addPropertiesBlock(setupSchema.properties, setupSchema.required || []);

  // Add the dependencies with a conditional schema block
  // if dependencies[propId].oneOf structure is used
  if (
    setupSchema.dependencies &&
    Object.keys(setupSchema.dependencies).length === 1
  ) {
    const dependantProperty = Object.keys(setupSchema.dependencies)[0];
    const oneOf = setupSchema.dependencies[dependantProperty].oneOf;
    if (Array.isArray(oneOf))
      for (const oneOfItem of oneOf) {
        const properitesNoDependant = omit(oneOfItem.properties, [
          dependantProperty
        ]);
        if (!isEmpty(properitesNoDependant)) {
          const ifSchema = {
            [dependantProperty]: (oneOfItem.properties || {})[dependantProperty]
          };
          addPropertiesBlock(
            properitesNoDependant,
            oneOfItem.required || [],
            ifSchema
          );
        }
      }
  }

  // Sorts the fields in the order of "ui:order"
  const uiOrder = setupUiJson["ui:order"] || [];
  return {
    version: "2",
    fields: [
      ...uiOrder
        .filter(propId => setupWizardObj[propId])
        .map(propId => setupWizardObj[propId]),
      ...Object.values(setupWizardObj).filter(
        field => !uiOrder.includes(field.id)
      )
    ]
  };
}

/**
 * Merge enum array conserving the original order and adding extra properties
 * at the end of the array if necessary.
 * Also make sure that the default enum is the first in the array
 */
function mergeEnum(
  prevEnum: string[],
  nextEnum: string[],
  defaultEnum?: string
): string[] {
  const mergedEnum = uniq([...prevEnum]);
  for (const nEnum of nextEnum) {
    if (!mergedEnum.includes(nEnum)) mergedEnum.push(nEnum);
  }
  return defaultEnum
    ? [defaultEnum, ...mergedEnum.filter(en => en !== defaultEnum)]
    : mergedEnum;
}

/**
 * Merge if schemas with the rule of merging / adding enum arrays while
 * mantaining unique values
 */
function mergeIfSchema(prevIf: SetupSchema, nextIf: SetupSchema): SetupSchema {
  return deepmerge(prevIf, nextIf);
}
