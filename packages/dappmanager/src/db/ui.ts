import { dbMain } from "./dbFactory.js";
import {
  NewFeatureId,
  NewFeatureStatus,
  UiModuleId,
  UiModuleStatus
} from "@dappnode/common";

const NEW_FEATURE_STATUS = "new-feature-status";
const UI_MODULES = "ui-modules";

export const newFeatureStatus = dbMain.indexedByKey<
  NewFeatureStatus,
  NewFeatureId
>({
  rootKey: NEW_FEATURE_STATUS,
  getKey: featureId => featureId
});

export const uiModules = dbMain.indexedByKey<UiModuleStatus, UiModuleId>({
  rootKey: UI_MODULES,
  getKey: moduleId => moduleId
});
