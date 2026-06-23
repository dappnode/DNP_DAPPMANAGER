import { Routes, Compose, SetupWizard } from "@dappnode/types";
import { packageInstallDev as pkgInstallDev } from "@dappnode/installer";
import { yamlParse } from "@dappnode/utils";
import * as db from "@dappnode/db";

/**
 * Installs a DAppNode Package locally for development, WITHOUT IPFS.
 *
 * The `compose` (and optional `setupWizard`) are received as YAML strings and
 * parsed here. The package image must already have been uploaded via `/upload`,
 * which returns a `fileId` stored in `db.fileTransferPath`. We resolve that
 * `imageFileId` to the host path and pass the path down to the installer.
 *
 * The package is flagged as a dev package and shown under the "My dev packages" tab.
 */
export async function packageInstallDev({
    manifest,
    compose,
    imageFileId,
    setupWizard
}: Parameters<Routes["packageInstallDev"]>[0]): Promise<void> {
    const imageTarPath = db.fileTransferPath.get(imageFileId);
    if (!imageTarPath) throw Error(`No uploaded file found for imageFileId ${imageFileId}`);

    const composeObj = yamlParse<Compose>(compose);
    const setupWizardObj = setupWizard ? yamlParse<SetupWizard>(setupWizard) : undefined;

    await pkgInstallDev({
        manifest,
        compose: composeObj,
        imageTarPath,
        setupWizard: setupWizardObj
    });
}
