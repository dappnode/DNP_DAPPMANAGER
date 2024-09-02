import { dbMain } from "./dbFactory.js";
import { NewFeatureId, NewFeatureStatus } from "@dappnode/types";

const NEW_FEATURE_STATUS = "new-feature-status";
const SMOOTH_SHOWN = "smooth-shown";

export const newFeatureStatus = dbMain.indexedByKey<NewFeatureStatus, NewFeatureId>({
  rootKey: NEW_FEATURE_STATUS,
  getKey: (featureId) => featureId
});

export const smoothShown = dbMain.staticKey<boolean>(SMOOTH_SHOWN, false);
