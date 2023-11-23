import { Manifest, DirectoryFiles } from "@dappnode/common";
import { validateManifestBasic } from "@dappnode/manifest";
import { validateCompose } from "@dappnode/dockercompose";

export function joinFilesInManifest(files: DirectoryFiles): Manifest {
  const manifest = files.manifest;

  if (files.setupWizard) manifest.setupWizard = files.setupWizard;
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
  compose: validateCompose,
};
