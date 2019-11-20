import { PackageNotification } from "../types";
import {
  packageNotificationSchema,
  packageNotificationSample
} from "../schemas";

export const route = "pushNotification.dappmanager.dnp.dappnode.eth";

export type ReturnData = PackageNotification;

export const returnDataSchema = packageNotificationSchema;

// Samples for testing

export const returnDataSample: ReturnData = packageNotificationSample;
