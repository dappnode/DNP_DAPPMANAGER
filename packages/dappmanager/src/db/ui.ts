import { dbMain } from "./dbFactory";
import { NewFeatureId, NewFeatureStatus } from "../types";

const NEW_FEATURE_STATUS = "new-feature-status";

export const newFeatureStatus = dbMain.indexedByKey<
  NewFeatureStatus,
  NewFeatureId
>({
  rootKey: NEW_FEATURE_STATUS,
  getKey: featureId => featureId
});
