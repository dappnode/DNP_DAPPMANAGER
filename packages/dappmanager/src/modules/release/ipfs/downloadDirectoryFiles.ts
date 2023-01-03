import { mapValues } from "lodash-es";
import { ReleaseSignature } from "../../../types";
import { Compose, Manifest } from "@dappnode/dappnodesdk";
import { findEntries } from "./findEntries";
import { downloadAsset } from "./downloadAssets";
import { IPFSEntry } from "ipfs-core-types/src/root";
import { promiseAllValues } from "../../../utils/promises";
import {
  releaseFilesToDownload,
  DirectoryFiles,
  joinFilesInManifest
} from "./params";

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
