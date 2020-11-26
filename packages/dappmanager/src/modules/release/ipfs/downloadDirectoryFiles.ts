import { mapValues } from "lodash";
import { Manifest, Compose, IpfsFileResult } from "../../../types";
import { findEntries } from "./findEntries";
import { downloadAsset } from "./downloadAssets";
import { promiseAllValues } from "../../../utils/promises";
import {
  releaseFilesToDownload,
  DirectoryFiles,
  joinFilesInManifest
} from "./params";

export async function downloadDirectoryFiles(
  ipfsFiles: IpfsFileResult[]
): Promise<{
  manifest: Manifest;
  compose: Compose;
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
    compose: files.compose
  };
}
