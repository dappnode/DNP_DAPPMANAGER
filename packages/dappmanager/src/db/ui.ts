import { dbMain } from "./dbFactory";
import { NewFeatureId, NewFeatureStatus } from "../types";
import { dbKeys } from "./dbUtils";

export const newFeatureStatus = dbMain.indexedByKey<
  NewFeatureStatus,
  NewFeatureId
>({
  rootKey: dbKeys.NEW_FEATURE_STATUS,
  getKey: featureId => featureId
});
