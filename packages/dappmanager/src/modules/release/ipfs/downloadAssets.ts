import retry from "async-retry";
import { ipfs } from "../../ipfs";
import { parseAsset } from "./parseAsset";
import { FileConfig } from "./types";
import { validateAsset, DirectoryFiles } from "./params";

interface FileData {
  hash: string;
}

export async function downloadAsset<T>(
  file: FileData[] | FileData | undefined,
  config: FileConfig,
  fileId: keyof DirectoryFiles
): Promise<T[] | T | undefined> {
  if (!file) {
    if (config.required) {
      throw Error(`File ${fileId} not found`);
    }
    return undefined;
  } else if (Array.isArray(file)) {
    if (!config.multiple) {
      throw Error(`Got multiple ${fileId}`);
    }
    return await Promise.all(
      file.map(f => downloadAssetRequired<T>(f, config, fileId))
    );
  } else {
    return downloadAssetRequired(file, config, fileId);
  }
}

export async function downloadAssetRequired<T>(
  file: FileData,
  config: FileConfig,
  fileId: keyof DirectoryFiles
): Promise<T> {
  const maxLength = config.maxSize;
  const format = config.format || "TEXT";
  const validate = validateAsset[fileId];

  const hash = file.hash;
  const content = await retry(() => ipfs.catString(hash, { maxLength }), {
    retries: 3,
    minTimeout: 225
  });

  const data = parseAsset(content, format);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (validate ? validate(data as any) : data) as T;
}
