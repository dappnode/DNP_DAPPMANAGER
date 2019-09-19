import fs from "fs";
import semver from "semver";
import restartPatch from "./docker/restartPatch";
import { dockerLoad, dockerImages, dockerRmi } from "./docker/dockerCommands";
import { dockerComposeUpSafe } from "./docker/dockerSafe";
import getImage from "./release/getImage";
import * as validate from "../utils/validate";
import * as getPath from "../utils/getPath";
import logUi from "../utils/logUi";
import params from "../params";
import { InstallerPkg } from "../types";
const { manifestToCompose } = require("@dappnode/dnp-manifest");

/**
 * Handles the download of a package.
 * @param {object} kwargs which should contain at least
 * - pkg: packageReq + its manifest. It is expected that in the previous step of the
 *        installation the manifest is attached to this object.
 * - id: task id to allow progress updates
 * @returns {*}
 */
export async function download({
  pkg,
  id
}: {
  pkg: InstallerPkg;
  id: string;
}): Promise<void> {
  // call IPFS, store the file in the repo's folder
  // load the image to docker
  const { manifest } = pkg;
  const { name, version } = manifest;
  const isCore = Boolean(pkg.isCore);
  // Construct image path, if not provided
  // "admin.dnp.dappnode.eth_0.2.0.tar.xz"
  const imageName = manifest.image.path || `${name}_${version}.tar.xz`;
  const imageHash = manifest.image.hash;
  const imageSize = manifest.image.size;
  const imagePath = validate.path(
    getPath.image(name, imageName, params, isCore)
  );

  // Wrap in try / catch to format the error
  try {
    logUi({ id, name, message: "Starting download..." });
    // Keep track of the bytes downloaded. Log UI every 2%
    await getImage(imageHash, imagePath, imageSize, (progress: number) => {
      let message = `Downloading ${progress}%`;
      if (progress > 100) message += ` (expected ${imageSize} bytes)`;
      logUi({ id, name, message });
    });
  } catch (e) {
    e.message = `Can't download ${name} image: ${e.message}`;
    throw e;
  }

  // Final log
  logUi({ id, name, message: "Package downloaded" });
}

/**
 * Handles the load of a package files.
 * @param {object} kwargs which should contain at least
 * - pkg: packageReq + its manifest. It is expected that in the previous step of the
 *        installation the manifest is attached to this object.
 * - id: task id to allow progress updates
 * @returns {*}
 */
export async function load({
  pkg,
  id
}: {
  pkg: InstallerPkg;
  id: string;
}): Promise<void> {
  // call IPFS, store the file in the repo's folder
  // load the image to docker
  const { manifest } = pkg;
  const { name, version } = manifest;
  const isCore = Boolean(pkg.isCore);
  // Construct image path, if not provided
  // "admin.dnp.dappnode.eth_0.2.0.tar.xz"
  const imageName = manifest.image.path || `${name}_${version}.tar.xz`;

  const imagePath = validate.path(
    getPath.image(name, imageName, params, isCore)
  );

  logUi({ id, name, message: "Loading image..." });
  await dockerLoad(imagePath);

  // Write manifest and docker-compose AFTER loading image
  fs.writeFileSync(
    validate.path(getPath.manifest(name, params, isCore)),
    JSON.stringify(manifest, null, 2)
  );
  fs.writeFileSync(
    validate.path(getPath.dockerCompose(name, params, isCore)),
    manifestToCompose(manifest)
  );

  logUi({ id, name, message: "Cleaning files..." });
  fs.unlinkSync(imagePath);

  // Final log
  logUi({ id, name, message: "Package Loaded" });
}

/**
 * Handles the execution of a package.
 * @param {object} kwargs which should contain at least
 * - pkg: packageReq + its manifest. It is expected that in the previous step of the
 *        installation the manifest is attached to this object.
 * - id: task id to allow progress updates
 * @returns {*}
 */
export async function run({
  pkg,
  id
}: {
  pkg: InstallerPkg;
  id: string;
}): Promise<void> {
  const { name, manifest } = pkg;
  const { version } = manifest;
  const isCore = Boolean(pkg.isCore);
  const dockerComposePath = getPath.dockerCompose(name, params, isCore);

  logUi({ id, name, message: "starting package... " });
  // patch to prevent installer from crashing
  if (name == "dappmanager.dnp.dappnode.eth") {
    await restartPatch(name + ":" + version);
  } else {
    await dockerComposeUpSafe(dockerComposePath);
  }

  // Clean old images. This command can throw errors.
  // If the images were removed successfuly the dappmanger will print logs:
  // Untagged: package.dnp.dappnode.eth:0.1.6
  logUi({ id, name, message: "cleaning old images" });
  try {
    const currentImgs = await dockerImages();
    await dockerRmi(
      (currentImgs || "").split(/\r|\n/).filter((p: string) => {
        const [pName, pVer] = p.split(":");
        return pName === name && semver.valid(pVer) && pVer !== version;
      })
    );
  } catch (e) {
    //
  }

  // Final log
  logUi({ id, name, message: "package started" });
}
