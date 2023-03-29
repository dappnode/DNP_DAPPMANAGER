import {
  SetupWizard,
  SetupSchema,
  GrafanaDashboard,
  PrometheusTarget,
  SetupTarget,
  SetupUiJson,
  Manifest,
  Compose
} from "@dappnode/dappnodesdk/dist/exports";
import { ReleaseSignature } from "../../../types.js";
import { releaseFiles } from "../../../params.js";
import { validateManifestBasic } from "../../manifest/index.js";
import { validateCompose } from "../../compose/index.js";

// Re-declare releaseFilesToDownload to prevent downloading un-wanted assets
// that may be added in the future
export const releaseFilesToDownload = {
  manifest: releaseFiles.manifest,
  compose: releaseFiles.compose,
  signature: releaseFiles.signature,
  setupWizard: releaseFiles.setupWizard,
  setupSchema: releaseFiles.setupSchema,
  setupTarget: releaseFiles.setupTarget,
  setupUiJson: releaseFiles.setupUiJson,
  disclaimer: releaseFiles.disclaimer,
  gettingStarted: releaseFiles.gettingStarted,
  prometheusTargets: releaseFiles.prometheusTargets,
  grafanaDashboards: releaseFiles.grafanaDashboards
};

export type DirectoryFiles = {
  manifest: Manifest;
  compose: Compose;
  signature?: ReleaseSignature;
  setupWizard?: SetupWizard;
  setupSchema?: SetupSchema;
  setupTarget?: SetupTarget;
  setupUiJson?: SetupUiJson;
  disclaimer?: string;
  gettingStarted?: string;
  prometheusTargets?: PrometheusTarget[];
  grafanaDashboards?: GrafanaDashboard[];
};

export function joinFilesInManifest(files: DirectoryFiles): Manifest {
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

export const validateAsset: {
  [K in keyof DirectoryFiles]: (data: DirectoryFiles[K]) => DirectoryFiles[K];
} = {
  manifest: validateManifestBasic,
  compose: validateCompose
};
