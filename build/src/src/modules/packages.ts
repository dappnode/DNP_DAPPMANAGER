import { promisify } from "util";
import fs from "fs";
import semver from "semver";
import restartPatch from "./restartPatch";
import docker from "./docker";
import downloadImage from "./downloadImage";
import * as validate from "../utils/validate";
import * as getPath from "../utils/getPath";
import logUi from "../utils/logUi";
import params from "../params";
import { InstallerPkgInterface } from "../types";
const { manifestToCompose } = require("@dappnode/dnp-manifest");

// Promisify fs methods
const removeFile = promisify(fs.unlink);
const writeFile = promisify(fs.writeFile);

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
  pkg: InstallerPkgInterface;
  id: string;
}) {
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

  // Keep track of the bytes downloaded. Log UI every 2%
  const onChunk = onChunkFactory(imageSize, 2, function(
    percent: number,
    bytes: number
  ) {
    const message =
      percent > 100
        ? `Downloading (${bytes} / ${imageSize} expected bytes) 100%`
        : `Downloading ${percent}%`;
    logUi({ id, name, message });
  });

  // Wrap in try / catch to format the error
  try {
    logUi({ id, name, message: "Starting download..." });
    await downloadImage(imageHash, imagePath, { onChunk });
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
  pkg: InstallerPkgInterface;
  id: string;
}) {
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
  await docker.load(imagePath);

  // Write manifest and docker-compose AFTER loading image
  await writeFile(
    validate.path(getPath.manifest(name, params, isCore)),
    JSON.stringify(manifest, null, 2)
  );
  await writeFile(
    validate.path(getPath.dockerCompose(name, params, isCore)),
    manifestToCompose(manifest)
  );

  logUi({ id, name, message: "Cleaning files..." });
  await removeFile(imagePath);

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
  pkg: InstallerPkgInterface;
  id: string;
}) {
  const { name, manifest } = pkg;
  const { version } = manifest;
  const isCore = Boolean(pkg.isCore);
  const dockerComposePath = getPath.dockerCompose(name, params, isCore);

  logUi({ id, name, message: "starting package... " });
  // patch to prevent installer from crashing
  if (name == "dappmanager.dnp.dappnode.eth") {
    await restartPatch(name + ":" + version);
  } else {
    await docker.compose.up(dockerComposePath);
  }

  // Clean old images. This command can throw errors.
  // If the images were removed successfuly the dappmanger will print logs:
  // Untagged: package.dnp.dappnode.eth:0.1.6
  logUi({ id, name, message: "cleaning old images" });
  try {
    const currentImgs = await docker.images();
    await docker.rmi(
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

// Utilities

/**
 * Utility to abstract the chunk progress tracking
 * @param {number} totalAmount Total amount to compute the ratio against
 * @param {number} resolution callback is called every ${resolution} %
 * @param {function} callback function(percent, currentAmount) {}
 */
function onChunkFactory(
  totalAmount: number,
  resolution: number,
  callback: (percent: number, currentAmount: number) => void
) {
  let currentAmount = 0;
  let prevPercent = 0;
  return function(chunk: any) {
    currentAmount += chunk.length;
    const ratio = currentAmount / totalAmount;
    const percent = resolution * Math.ceil((100 * ratio) / resolution);
    if (percent > prevPercent) {
      prevPercent = percent;
      callback(percent, currentAmount);
    }
  };
}
