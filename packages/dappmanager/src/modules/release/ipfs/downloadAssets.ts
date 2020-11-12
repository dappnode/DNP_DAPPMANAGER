import * as ipfs from "../../ipfs";
import memoize from "memoizee";
import { parseAsset } from "./parseAsset";
import { FileConfig } from "./types";

interface FileData {
  hash: string;
}

const ipfsCatStringMemoized = memoize(ipfs.catString, {
  promise: true,
  normalizer: ([{ hash }]) => hash
});

export async function downloadAsset<T>(
  file: FileData[] | FileData | undefined,
  config: FileConfig,
  fileId: string
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
      file.map(f => downloadAssetRequired<T>(f, config))
    );
  } else {
    return downloadAssetRequired(file, config);
  }
}

export async function downloadAssetRequired<T>(
  file: FileData,
  config: FileConfig
): Promise<T> {
  const maxLength = config.maxSize;
  const format = config.format || "TEXT";

  const hash = file.hash;
  const content = await ipfsCatStringMemoized({ hash, maxLength });
  return parseAsset(content, format);
}
