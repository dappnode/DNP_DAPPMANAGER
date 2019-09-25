import { dynamicKeyValidate, joinWithDot } from "./lowLevelDb";

const FILE_TRANSFER_PATH = "file-transfer-path";

const fileTransferPathKeyGetter = (fileId: string): string =>
  joinWithDot(FILE_TRANSFER_PATH, fileId);
const fileTransferPathValidate = (filePath: string): boolean => {
  return typeof filePath === "string";
};

export const fileTransferPath = dynamicKeyValidate<string, string>(
  fileTransferPathKeyGetter,
  fileTransferPathValidate
);
