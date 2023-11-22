import { mapValues } from "lodash-es";
import { ReleaseSignature, Compose, Manifest } from "@dappnode/common";
import { findEntries } from "./findEntries.js";
import { downloadAsset } from "./downloadAssets.js";
import { IPFSEntry } from "ipfs-core-types/src/root";
import { zipObject, keys, values } from "lodash-es";
import {
  releaseFilesToDownload,
  DirectoryFiles,
  joinFilesInManifest,
} from "./params.js";

export async function downloadDirectoryFiles(
  ipfsFiles: IPFSEntry[]
): Promise<{
  manifest: Manifest;
  compose: Compose;
  signature?: ReleaseSignature;
}> {
  // Use Required<> to assert that DirectoryFiles keys match releaseFilesToDownload
  const files = await promiseAllValues<Required<DirectoryFiles>>(
    mapValues(releaseFilesToDownload, (fileConfig, _fileId) => {
      const fileId = _fileId as keyof DirectoryFiles;
      const entries = findEntries(ipfsFiles, fileConfig, fileId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return downloadAsset<any>(entries, fileConfig, fileId);
    })
  );

  return {
    manifest: joinFilesInManifest(files),
    compose: files.compose,
    signature: files.signature,
  };
}

/**
 * Object version of Promise.all(). Resolves all values in an object
 * JS version from https://stackoverflow.com/questions/29292921/how-to-use-promise-all-with-an-object-as-input
 * @param promisesObj
 */
async function promiseAllValues<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { [key: string]: any }
>(promisesObj: { [K in keyof T]: Promise<T[K]> | undefined }): Promise<T> {
  const resolvedValues = zipObject(
    keys(promisesObj),
    await Promise.all(values(promisesObj))
  );
  return resolvedValues as T;
}
