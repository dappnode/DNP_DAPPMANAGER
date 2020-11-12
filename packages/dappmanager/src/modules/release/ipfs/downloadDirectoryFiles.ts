import { mapValues } from "lodash";
import {
  Manifest,
  Compose,
  SetupTarget,
  SetupWizard,
  SetupSchema,
  SetupUiJson,
  GrafanaDashboard,
  PrometheusTarget,
  IpfsFileResult
} from "../../../types";
import { findEntries } from "./findEntries";
import { downloadAsset } from "./downloadAssets";
import { releaseFiles } from "../../../params";
import { promiseAllValues } from "../../../utils/promises";
import { validateManifestBasic } from "../../manifest";
import { validateCompose } from "../../compose";

// Re-declare releaseFilesToDownload to prevent downloading un-wanted assets
// that may be added in the future
const releaseFilesToDownload = {
  manifest: releaseFiles.manifest,
  compose: releaseFiles.compose,
  setupWizard: releaseFiles.setupWizard,
  setupSchema: releaseFiles.setupSchema,
  setupTarget: releaseFiles.setupTarget,
  setupUiJson: releaseFiles.setupUiJson,
  disclaimer: releaseFiles.disclaimer,
  gettingStarted: releaseFiles.gettingStarted,
  prometheusTargets: releaseFiles.prometheusTargets,
  grafanaDashboards: releaseFiles.grafanaDashboards
};

type DirectoryFiles = {
  manifest: Manifest;
  compose: Compose;
  setupWizard?: SetupWizard;
  setupSchema?: SetupSchema;
  setupTarget?: SetupTarget;
  setupUiJson?: SetupUiJson;
  disclaimer?: string;
  gettingStarted?: string;
  prometheusTargets?: PrometheusTarget[];
  grafanaDashboards?: GrafanaDashboard[];
};

export async function downloadDirectoryFiles(
  ipfsFiles: IpfsFileResult[]
): Promise<{
  manifest: Manifest;
  compose: Compose;
}> {
  // Use Required<> to assert that DirectoryFiles keys match releaseFilesToDownload
  const files = await promiseAllValues<Required<DirectoryFiles>>(
    mapValues(releaseFilesToDownload, (fileConfig, fileId) => {
      const entries = findEntries(ipfsFiles, fileConfig, fileId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return downloadAsset<any>(entries, fileConfig, fileId);
    })
  );

  validateManifestBasic(files.manifest);
  validateCompose(files.compose);

  return {
    manifest: joinFilesInManifest(files),
    compose: files.compose
  };
}

function joinFilesInManifest(files: DirectoryFiles): Manifest {
  const manifest = files.manifest;

  // Note: setupWizard1To2 conversion is done on parseMetadataFromManifest
  if (files.setupWizard) manifest.setupWizard = files.setupWizard;
  if (files.setupSchema) manifest.setupSchema = files.setupSchema;
  if (files.setupTarget) manifest.setupTarget = files.setupTarget;
  if (files.setupUiJson) manifest.setupUiJson = files.setupUiJson;
  if (files.disclaimer) manifest.disclaimer = { message: files.disclaimer };
  if (files.gettingStarted) manifest.gettingStarted = files.gettingStarted;
  if (files.prometheusTargets)
    manifest.prometheusTargets = files.prometheusTargets;
  if (files.grafanaDashboards && files.grafanaDashboards.length > 0)
    manifest.grafanaDashboards = files.grafanaDashboards;

  return manifest;
}
