import { Routes, Compose, SetupWizard } from "@dappnode/types";
import { packageInstallDev as pkgInstallDev } from "@dappnode/installer";
import { yamlParse } from "@dappnode/utils";

/**
 * Installs a DAppNode Package locally for development, WITHOUT IPFS.
 *
 * The `compose` (and optional `setupWizard`) are received as YAML strings and
 * parsed here. The package image must already be available to the Docker daemon
 * as a `docker save` tarball at `imageTarPath` (a path readable by the dappmanager).
 *
 * The package is flagged as a dev package and shown under the "My dev packages" tab.
 */
export async function packageInstallDev({
  manifest,
  compose,
  imageTarPath,
  setupWizard
}: Parameters<Routes["packageInstallDev"]>[0]): Promise<void> {
  const composeObj = yamlParse<Compose>(compose);
  const setupWizardObj = setupWizard ? yamlParse<SetupWizard>(setupWizard) : undefined;

  await pkgInstallDev({
    manifest,
    compose: composeObj,
    imageTarPath,
    setupWizard: setupWizardObj
  });
}
