import fs from "fs";
import path from "path";
import { getInstallerPackagesData } from "../installer/getInstallerPackageData.js";
import createVolumeDevicePaths from "../installer/createVolumeDevicePaths.js";
import {
  flagPackagesAreInstalling,
  packageIsInstalling,
  runPackages,
  rollbackPackages,
  writeAndValidateFiles,
  postInstallClean,
  afterInstall,
  checkInstallRequirements
} from "../installer/index.js";
import { sanitizeDependencies } from "../dappGet/utils/sanitizeDependencies.js";
import { parseTimeoutSeconds } from "../utils.js";
import { logs, getLogUi, logUiClear } from "@dappnode/logger";
import { getDockerImageManifest, loadImage } from "@dappnode/dockerapi";
import { ComposeEditor, setDappnodeComposeDefaults, writeMetadataToLabels } from "@dappnode/dockercompose";
import { computeGlobalEnvsFromDb } from "@dappnode/db";
import { params } from "@dappnode/params";
import { getAvatarPath } from "@dappnode/utils";
import { validateDappnodeCompose, validateManifestSchema, validateSetupWizardSchema } from "@dappnode/schemas";
import {
  Compose,
  getImageTag,
  Manifest,
  PackageRelease,
  ReleaseSignatureStatusCode,
  SetupWizard
} from "@dappnode/types";

/**
 * Default avatar for dev packages. Stored under the non-core avatars directory
 * as a fallback so the UI can serve a real icon instead of the generic placeholder.
 */
const DEFAULT_DEV_AVATAR_FILENAME = "dev-default-avatar.png";

const CORE_DNP_NAMES = new Set([
  params.dappmanagerDnpName,
  params.WIREGUARD_DNP_NAME,
  params.vpnDnpName,
  params.wifiDnpName,
  params.bindDnpName,
  params.ipfsDnpName,
  params.HTTPS_PORTAL_DNPNAME,
  params.notificationsDnpName,
  params.PREMIUM_DNP_NAME
]);

function isCorePackageIdentity(manifest: Manifest): boolean {
  return manifest.type === "dncore" || CORE_DNP_NAMES.has(manifest.name);
}

/**
 * Installs a DAppNode Package locally for development, WITHOUT IPFS.
 *
 * The package image must already be available to the Docker daemon as a
 * `docker save` tarball at `imageTarPath` (a path readable by the dappmanager).
 * The image inside the tarball must be tagged exactly `<service>.<dnpName>:<version>`
 * (the same tag DAppNode forces in the compose), so `docker load` makes it available
 * for `docker compose up`.
 *
 * The package is tagged with the `dappnode.dnp.isDev` container label so the UI
 * can list it under the "My dev packages" tab and keep it separate from packages
 * installed from the registry.
 */
export async function packageInstallDev({
  manifest,
  compose,
  imageTarPath,
  setupWizard
}: {
  manifest: Manifest;
  compose: Compose;
  imageTarPath: string;
  setupWizard?: SetupWizard;
}): Promise<void> {
  const dnpName = manifest.name;
  const id = dnpName;
  const log = getLogUi(id);

  try {
    // Validate the package definition (pure, offline checks)
    validateManifestSchema(manifest);
    validateDappnodeCompose(compose, manifest);
    if (setupWizard) validateSetupWizardSchema(setupWizard);

    if (isCorePackageIdentity(manifest)) {
      throw Error("Dev packages cannot use core package names or type=dncore");
    }
    await checkInstallRequirements({ manifest });

    if (packageIsInstalling(dnpName)) throw Error(`${dnpName} is installing`);

    // Apply DAppNode compose defaults and tag the package as a dev package
    const devCompose = buildDevCompose(compose, manifest);

    const release: PackageRelease = {
      dnpName,
      reqVersion: manifest.version,
      semVersion: manifest.version,
      manifest,
      compose: devCompose,
      setupWizard,
      // The image is provided locally as a tarball, not downloaded from IPFS
      imageFile: { hash: "dev", source: "mirror", size: 0 },
      warnings: {},
      isCore: false,
      origin: "dev",
      signedSafe: true,
      signatureStatus: { status: ReleaseSignatureStatusCode.notSigned }
    };

    const packagesData = await getInstallerPackagesData({
      releases: [release],
      userSettings: {},
      notificationsSettings: {},
      currentVersions: { [dnpName]: undefined },
      reqName: dnpName
    });

    flagPackagesAreInstalling([dnpName]);
    try {
      log(id, "Verifying dev image...");
      await verifyDevImageTar({ imageTarPath, manifest, compose: devCompose });

      log(id, "Loading dev image...");
      await loadImage(imageTarPath, (event) => log(id, event.status || ""));

      // Persist a default avatar for the dev package so the UI has an icon.
      // Future: accept an uploaded avatar file and persist it instead.
      await persistDevAvatar(dnpName);

      await createVolumeDevicePaths(packagesData);
      await writeAndValidateFiles(packagesData, log);

      try {
        await runPackages(packagesData, log);
      } catch (e) {
        await rollbackPackages(packagesData, log);
        throw e;
      }

      await postInstallClean(packagesData, log);
      afterInstall([dnpName]);
      logUiClear({ id });
    } catch (e) {
      afterInstall([dnpName]);
      throw e;
    }
  } catch (e) {
    logs.error(`Error installing dev package ${dnpName}`, e);
    logUiClear({ id });
    throw e;
  }
}

/**
 * Applies the DAppNode compose defaults and writes the package metadata to the
 * container labels, flagging the package as a dev package (`isDev: true`).
 * Mirrors `DappnodeInstaller.addCustomDefaultsAndLabels` but for local dev installs.
 */
function buildDevCompose(compose: Compose, manifest: Manifest): Compose {
  const customCompose = new ComposeEditor(setDappnodeComposeDefaults(compose, manifest), { dnpName: manifest.name });

  const services = Object.values(customCompose.services());
  const globalEnvsFromDbPrefixed = computeGlobalEnvsFromDb(true);
  const isCore = false;

  for (const service of services) {
    service.setGlobalEnvs(manifest.globalEnvs, globalEnvsFromDbPrefixed, isCore);

    service.mergeLabels(
      writeMetadataToLabels({
        dnpName: manifest.name,
        version: manifest.version,
        serviceName: service.serviceName,
        dependencies: sanitizeDependencies(manifest.dependencies || {}),
        chain: manifest.chain,
        categories: manifest.categories,
        origin: "dev",
        isCore,
        isDev: true,
        isMain: manifest.mainService === service.serviceName || services.length === 1 ? true : undefined,
        dockerTimeout: parseTimeoutSeconds(manifest.dockerTimeout)
      })
    );
  }

  return customCompose.compose;
}

async function verifyDevImageTar({
  imageTarPath,
  manifest,
  compose
}: {
  imageTarPath: string;
  manifest: Manifest;
  compose: Compose;
}): Promise<void> {
  const expectedTags = new Set(
    Object.keys(compose.services).map((serviceName) =>
      getImageTag({ dnpName: manifest.name, serviceName, version: manifest.version })
    )
  );
  const foundTags = new Set<string>();
  const images = await getDockerImageManifest(imageTarPath);

  if (images.length === 0) throw Error("Docker image archive does not contain any images");

  for (const image of images) {
    const repoTags = image.RepoTags || [];
    if (repoTags.length === 0) throw Error("Docker image archive contains an untagged image");

    for (const repoTag of repoTags) {
      if (!expectedTags.has(repoTag)) {
        throw Error(`Invalid dev image tag '${repoTag}'. Expected only: ${Array.from(expectedTags).join(", ")}`);
      }
      foundTags.add(repoTag);
    }
  }

  const missingTags = Array.from(expectedTags).filter((tag) => !foundTags.has(tag));
  if (missingTags.length > 0) {
    throw Error(`Docker image archive is missing expected tag(s): ${missingTags.join(", ")}`);
  }
}

/**
 * Copies the default dev-package avatar into the non-core avatars directory
 * under `<dnpName>.png`, so `resolveAvatarUrl()` can serve it at `/avatars/`.
 *
 * This is a temporary default; the upload/install flow can later accept an
 * explicit `avatarFileId` and copy that file here instead.
 */
async function persistDevAvatar(dnpName: string): Promise<void> {
  try {
    const avatarPath = getAvatarPath(dnpName, false);
    const avatarDir = path.dirname(avatarPath);
    if (!fs.existsSync(avatarDir)) {
      fs.mkdirSync(avatarDir, { recursive: true });
    }

    // Avoid overwriting an existing avatar in case the user later uploads one.
    if (fs.existsSync(avatarPath)) return;

    const defaultAvatarPath = path.join(__dirname, "..", "..", "assets", DEFAULT_DEV_AVATAR_FILENAME);
    if (!fs.existsSync(defaultAvatarPath)) {
      logs.warn(`Default dev avatar not found at ${defaultAvatarPath}, skipping`);
      return;
    }

    await fs.promises.copyFile(defaultAvatarPath, avatarPath);
  } catch (e) {
    // Avatar persistence must never block installation.
    logs.warn(`Failed to persist dev avatar for ${dnpName}: ${e.message}`);
  }
}
