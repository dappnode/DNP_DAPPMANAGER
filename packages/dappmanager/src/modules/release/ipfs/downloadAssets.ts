import memoize from "memoizee";
import retry from "async-retry";
import { ipfs, IpfsCatOptions } from "../../ipfs";
import { parseAsset } from "./parseAsset";
import { FileConfig } from "./types";
import { validateAsset, DirectoryFiles } from "./params";

interface FileData {
  hash: string;
}

const ipfsCatStringMemoized = memoize(
  (hash: string, opts: IpfsCatOptions) =>
    retry(() => ipfs.catString(hash, opts), {
      retries: 3,
      minTimeout: 225
    }),
  {
    promise: true,
    normalizer: ([hash]) => hash,
    max: 200,
    maxAge: 60 * 60 * 1000
  }
);

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
  const content = await ipfsCatStringMemoized(hash, { maxLength });
  const data = parseAsset(content, format);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (validate ? validate(data as any) : data) as T;
}
