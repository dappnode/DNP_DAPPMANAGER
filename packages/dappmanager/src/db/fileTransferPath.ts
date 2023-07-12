import { dbCache } from "./dbFactory.js";

const FILE_TRANSFER_PATH = "file-transfer-path";

export const fileTransferPath = dbCache.indexedByKey<string, string>({
  rootKey: FILE_TRANSFER_PATH,
  getKey: fileId => fileId,
  validate: filePath => typeof filePath === "string"
});
