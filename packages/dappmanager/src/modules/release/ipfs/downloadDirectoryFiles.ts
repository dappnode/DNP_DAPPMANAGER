import { Manifest, Compose } from "../../../types";
import { ReleaseIpfsFiles } from "./parseDirectoryFiles";
import { download } from "./downloadAssets";

export type DirectoryFilesDownloaded = {
  manifest: Manifest;
  compose: Compose;
};

export async function downloadDirectoryFiles(
  entries: ReleaseIpfsFiles
): Promise<DirectoryFilesDownloaded> {
  const [
    manifest,
    compose,
    setupWizard,
    setupSchema,
    setupTarget,
    setupUiJson,
    disclaimer,
    gettingStarted,
    prometheusTargets,
    grafanaDashboards
  ] = await Promise.all([
    download.manifest(entries.manifest),
    download.compose(entries.compose),
    entries.setupWizard && download.setupWizard(entries.setupWizard),
    entries.setupSchema && download.setupSchema(entries.setupSchema),
    entries.setupTarget && download.setupTarget(entries.setupTarget),
    entries.setupUiJson && download.setupUiJson(entries.setupUiJson),
    entries.disclaimer && download.disclaimer(entries.disclaimer),
    entries.gettingStarted && download.gettingStarted(entries.gettingStarted),
    entries.prometheusTargets &&
      download.prometheusTargets(entries.prometheusTargets),
    await Promise.all(entries.grafanaDashboards.map(download.grafanaDashboards))
  ]);

  // Note: setupWizard1To2 conversion is done on parseMetadataFromManifest
  if (setupWizard) manifest.setupWizard = setupWizard;
  if (setupSchema) manifest.setupSchema = setupSchema;
  if (setupTarget) manifest.setupTarget = setupTarget;
  if (setupUiJson) manifest.setupUiJson = setupUiJson;
  if (disclaimer) manifest.disclaimer = { message: disclaimer };
  if (gettingStarted) manifest.gettingStarted = gettingStarted;
  if (prometheusTargets) manifest.prometheusTargets = prometheusTargets;
  if (grafanaDashboards.length > 0)
    manifest.grafanaDashboards = grafanaDashboards;

  return {
    manifest,
    compose
  };
}
