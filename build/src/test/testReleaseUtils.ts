import path from "path";
import fs from "fs";
import { isEqual } from "lodash";
import { testDir } from "./testUtils";
import shell from "../src/utils/shell";
import params from "../src/params";
import * as validate from "../src/utils/validate";
import {
  ipfsAddDirFromFs,
  ipfsAddManifest,
  ipfsAddFromFs
} from "./testIpfsUtils";
import * as ipfs from "../src/modules/ipfs";
import { ManifestWithImage } from "../src/types";

/**
 * Generate mock releases in the different formats,
 * and try to retrieve and run them
 * - IPFS directory with docker-compose
 * - IPFS directory generate docker-compose from manifest
 * - IPFS manifest, generate docker-compose from manifest
 */

export const releaseDnpName = "mock-test.public.dappnode.eth";
export const releaseVersion = "0.0.1";

const buildFilesDir = path.resolve(
  "./test/",
  "DAppNodePackage-mock-test",
  "buildFiles"
);

const manifestFileOld = "dappnode_package.json";
const manifestFileNoHashes = "dappnode_package-no-hashes.json";
const manifestFileNoImage = "dappnode_package-no-image.json";
const composeFile = "docker-compose-mock-test.yml";
const imageFile = "mock-test.public.dappnode.eth_0.0.1.tar.xz";
const imagePath = path.join(buildFilesDir, imageFile);
const imageTag = "mock-test.public.dappnode.eth:0.0.1";

export function verifyFiles(): void {
  if (!fs.existsSync(buildFilesDir))
    throw Error(`build files dir not found at ${buildFilesDir}`);
  for (const file of [
    manifestFileOld,
    manifestFileNoHashes,
    composeFile,
    imageFile
  ]) {
    if (!fs.existsSync(path.join(buildFilesDir, file)))
      throw Error(`file ${file} not found in ${buildFilesDir}`);
  }
}

export async function cleanInstallationArtifacts(): Promise<void> {
  await shell(`rm -rf ${params.REPO_DIR}`);
  const containersToKill = await shell(
    `docker ps -f name=${releaseDnpName} -a -q`
  );
  if (containersToKill) await shell(`docker rm -f ${containersToKill}`);
}

/**
 * Release type: `Directory-type, WITH docker-compose`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns {string} releaseHash
 */
export async function prepareDirectoryTypeReleaseWithDockerCompose(): Promise<
  string
> {
  const releaseDir = path.join(testDir, "release-directory-docker-compose");
  const filesToUpload = [manifestFileNoImage, composeFile, imageFile];

  fs.mkdirSync(releaseDir, { recursive: true });
  for (const file of filesToUpload)
    fs.copyFileSync(
      path.join(buildFilesDir, file),
      path.join(releaseDir, file)
    );

  const rootHash = await ipfsAddDirFromFs(releaseDir);

  // Verify the uploaded files
  const files = await ipfs.ls({ hash: rootHash });
  if (!isEqual(files.map(f => f.name), filesToUpload))
    throw Error("Uploaded files do not match");

  return rootHash;
}

/**
 * Release type: `Directory-type, NO docker-compose`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns {string} releaseHash
 */
export async function prepareDirectoryTypeReleaseNoDockerCompose(): Promise<
  string
> {
  const releaseDir = path.join(testDir, "release-directory-no-compose");
  const filesToUpload = [manifestFileNoHashes, imageFile];

  fs.mkdirSync(releaseDir, { recursive: true });
  for (const file of filesToUpload)
    fs.copyFileSync(
      path.join(buildFilesDir, file),
      path.join(releaseDir, file)
    );

  const rootHash = await ipfsAddDirFromFs(releaseDir);

  // Verify the uploaded files
  const files = await ipfs.ls({ hash: rootHash });
  if (!isEqual(files.map(f => f.name), filesToUpload))
    throw Error("Uploaded files do not match");

  return rootHash;
}

/**
 * Release type: `Manifest-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns {string} releaseHash
 */
export async function prepareManifestTypeRelease(
  manifest?: ManifestWithImage
): Promise<string> {
  const imageUpload =
    manifest && manifest.name !== releaseDnpName
      ? await uploadNewImageToIpfs(manifest)
      : await uploadImageToIpfs(imagePath);

  if (!manifest)
    manifest = JSON.parse(
      fs.readFileSync(path.join(buildFilesDir, manifestFileOld), "utf8")
    );
  if (!manifest) throw Error("No manifest");
  if (!manifest.image) throw Error("No image in manifest");
  manifest.image.hash = imageUpload.hash;
  manifest.image.size = imageUpload.size;

  const releaseHashManifest = await ipfsAddManifest(manifest);

  // Verify the uploaded files
  const manifestUploaded = await ipfs
    .cat({ hash: releaseHashManifest })
    .then(file => JSON.parse(file.toString()));
  if (!isEqual(manifestUploaded, manifest))
    throw Error("Wrong uploaded manifest");

  return releaseHashManifest;
}

interface IpfsUploadReturn {
  hash: string;
  size: number;
}

/**
 * Uploads an image correctly tagged with a different name and version
 * @param name "different.dnp.dappnode.eth"
 * @param version "0.2.0"
 */
async function uploadNewImageToIpfs({
  name,
  version
}: {
  name: string;
  version: string;
}): Promise<IpfsUploadReturn> {
  const newImagePath = path.resolve(testDir, `${name}_${version}.tar.xz`);
  const newImageTag = `${name}:${version}`;
  // Load image if not in docker already
  if (!(await shell(`docker images -q ${imageTag}`)))
    await shell(`docker load < ${imagePath}`);

  validate.path(newImagePath);
  await shell(`docker tag ${imageTag} ${newImageTag}`);
  await shell(`docker save ${newImageTag} | xz > ${newImagePath}`);
  return await uploadImageToIpfs(newImagePath);
}

async function uploadImageToIpfs(
  _imagePath: string
): Promise<IpfsUploadReturn> {
  const uploadedFiles = await ipfsAddFromFs(_imagePath);
  return {
    hash: uploadedFiles[0].hash,
    size: uploadedFiles[0].size
  };
}
