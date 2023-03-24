import { mapValues } from "lodash-es";
import { ReleaseSignature } from "../../../types.js";
import { Compose, Manifest } from "@dappnode/dappnodesdk";
import { findEntries } from "./findEntries.js";
import { downloadAsset } from "./downloadAssets.js";
import { promiseAllValues } from "../../../utils/promises.js";
import {
  releaseFilesToDownload,
  DirectoryFiles,
  joinFilesInManifest
} from "./params.js";
import { IPFSEntry } from "../../ipfs/types.js";

export async function downloadDirectoryFiles(ipfsFiles: IPFSEntry[]): Promise<{
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
    signature: files.signature
  };
}
