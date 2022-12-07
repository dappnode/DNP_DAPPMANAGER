import { dbCache } from "./dbFactory";
import { dbKeys } from "./dbUtils";

export const fileTransferPath = dbCache.indexedByKey<string, string>({
  rootKey: dbKeys.FILE_TRANSFER_PATH,
  getKey: fileId => fileId,
  validate: filePath => typeof filePath === "string"
});
