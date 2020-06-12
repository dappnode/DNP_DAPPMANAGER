import * as dbCache from "./dbCache";
import { joinWithDot } from "./dbUtils";

const FILE_TRANSFER_PATH = "file-transfer-path";

const fileTransferPathKeyGetter = (fileId: string): string =>
  joinWithDot(FILE_TRANSFER_PATH, fileId);
const fileTransferPathValidate = (filePath: string): boolean => {
  return typeof filePath === "string";
};

export const fileTransferPath = dbCache.dynamicKeyValidate<string, string>(
  fileTransferPathKeyGetter,
  fileTransferPathValidate
);
