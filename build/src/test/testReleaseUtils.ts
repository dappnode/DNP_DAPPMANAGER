import path from "path";
import fs from "fs";
import yaml from "js-yaml";
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
import { ManifestWithImage, Manifest, Compose } from "../src/types";
import { SetupSchema, SetupUiJson } from "../src/types-own";

/**
 * Generate mock releases in the different formats,
 * and try to retrieve and run them
 * - IPFS directory with docker-compose
 * - IPFS directory generate docker-compose from manifest
 * - IPFS manifest, generate docker-compose from manifest
 */

export const releaseDnpName = "mock-test.public.dappnode.eth";
export const releaseVersion = "0.0.1";

const mockDnpDir = path.resolve("./test/", "DAppNodePackage-mock-test");
const buildFilesDir = path.resolve(mockDnpDir, "buildFiles");

const manifestFileOld = "dappnode_package.json";
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
    manifestFileNoImage,
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
 * Release type: `Directory-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns {string} releaseHash
 */
export async function uploadDirectoryRelease({
  manifest,
  compose,
  setupWizard,
  setupWizardUi,
  disclaimer
}: {
  manifest: Manifest;
  compose: Compose;
  setupWizard?: SetupSchema;
  setupWizardUi?: SetupUiJson;
  disclaimer?: string;
}): Promise<string> {
  const releaseDir = path.join(testDir, "release-directory");
  await shell(`rm -rf ${releaseDir}`); // Clean dir before populating

  fs.mkdirSync(releaseDir, { recursive: true });

  function writeAsset(fileName: string, data: string): void {
    fs.writeFileSync(path.join(releaseDir, fileName), data);
  }
  function writeJson<T>(fileName: string, jsonData: T): void {
    writeAsset(fileName, JSON.stringify(jsonData, null, 2));
  }

  writeJson("dappnode_package.json", manifest); // Manifest
  writeAsset("docker-compose.yml", yaml.safeDump(compose)); // Compose
  // const filesToUpload = [manifestFileNoImage, composeFile, imageFile];
  await saveNewImageToDisk(manifest, releaseDir); // Image
  await shell(`cp ${mockDnpDir}/*.png ${releaseDir}`); // Avatar

  // Misc
  if (setupWizard) writeJson("setup.schema.json", setupWizard);
  if (setupWizardUi) writeJson("setup-ui.json", setupWizardUi);
  if (disclaimer) writeAsset("disclaimer.md", disclaimer);

  const rootHash = await ipfsAddDirFromFs(releaseDir);

  // Verify the uploaded files
  // const files = await ipfs.ls({ hash: rootHash });
  // if (!isEqual(files.map(f => f.name), filesToUpload))
  //   throw Error("Uploaded files do not match");

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
export async function uploadManifestRelease(
  manifest?: ManifestWithImage
): Promise<{ hash: string; imageSize: number }> {
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

  return { hash: releaseHashManifest, imageSize: imageUpload.size };
}

/**
 * Release type: `Directory-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns {string} releaseHash
 */
export async function prepareDirectoryTypeRelease(): Promise<string> {
  const releaseDir = path.join(testDir, "release-directory");
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
 * Alias of above, but just returns the manifest release hash
 */
export async function prepareManifestTypeRelease(
  manifest?: ManifestWithImage
): Promise<string> {
  const upload = await uploadManifestRelease(manifest);
  return upload.hash;
}

interface IpfsUploadReturn {
  hash: string;
  size: number;
}

/**
 * Saves an image correctly tagged with a different name and version
 * @param name "different.dnp.dappnode.eth"
 * @param version "0.2.0"
 * @return newImagePath
 */
async function saveNewImageToDisk(
  {
    name,
    version
  }: {
    name: string;
    version: string;
  },
  dirToSaveTo: string = testDir
): Promise<string> {
  const newImagePath = path.resolve(dirToSaveTo, `${name}_${version}.tar.xz`);
  const newImageTag = `${name}:${version}`;
  // Load image if not in docker already
  if (!(await shell(`docker images -q ${imageTag}`)))
    await shell(`docker load < ${imagePath}`);

  validate.path(newImagePath);
  await shell(`docker tag ${imageTag} ${newImageTag}`);
  await shell(`docker save ${newImageTag} | xz > ${newImagePath}`);
  return newImagePath;
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
  const newImagePath = await saveNewImageToDisk({ name, version });
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
