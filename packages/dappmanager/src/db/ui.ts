import { dynamicKeyValidate } from "./dbMain";
import { NewFeatureId, NewFeatureStatus } from "../types";
import { joinWithDot } from "./dbUtils";

const NEW_FEATURE_STATUS = "new-feature-status";

export const newFeatureStatus = dynamicKeyValidate<
  NewFeatureStatus,
  NewFeatureId
>(
  (featureId: NewFeatureId): string =>
    joinWithDot(NEW_FEATURE_STATUS, featureId),
  () => true
);
