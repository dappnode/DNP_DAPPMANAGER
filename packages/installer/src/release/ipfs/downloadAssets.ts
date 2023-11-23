import retry from "async-retry";
import { ipfs } from "@dappnode/ipfs";
import { IPFSEntry } from "ipfs-core-types/src/root";
import { parseAsset } from "./parseAsset.js";
import { FileConfig } from "../types.js";
import { validateAsset } from "./params.js";
import { FileFormat, DirectoryFiles } from "@dappnode/common";

export async function downloadAsset<T>(
  file: IPFSEntry[] | IPFSEntry | undefined,
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
      file.map((f) =>
        downloadAssetRequired<T>(f.cid.toString(), config, fileId)
      )
    );
  } else {
    return downloadAssetRequired(file.cid.toString(), config, fileId);
  }
}

async function downloadAssetRequired<T>(
  hash: string,
  config: FileConfig,
  fileId: keyof DirectoryFiles
): Promise<T> {
  const maxLength = config.maxSize;
  const format = config.format || FileFormat.TEXT;
  const validate = validateAsset[fileId];

  const content = await retry(
    () => ipfs.writeFileToMemory(hash, { maxLength }),
    {
      retries: 3,
      minTimeout: 225,
    }
  );

  const data = parseAsset(content, format);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (validate ? validate(data as any) : data) as T;
}
