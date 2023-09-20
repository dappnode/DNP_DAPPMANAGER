import { dbMain } from "./dbFactory.js";
import {
  NewFeatureId,
  NewFeatureStatus,
} from "@dappnode/common";

const NEW_FEATURE_STATUS = "new-feature-status";

export const newFeatureStatus = dbMain.indexedByKey<
  NewFeatureStatus,
  NewFeatureId
>({
  rootKey: NEW_FEATURE_STATUS,
  getKey: featureId => featureId
});

