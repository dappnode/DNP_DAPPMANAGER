import "mocha";
import { expect } from "chai";
import fs from "fs";
import path from "path";
import ipfsRaw from "../src/modules/ipfs/ipfsSetup";
import * as ipfs from "../src/modules/ipfs";
import * as calls from "../src/calls";
import { testDir, createTestDir } from "./testUtils";
import params from "../src/params";
import shell from "../src/utils/shell";
import { Manifest, ManifestWithImage } from "../src/types";
const Ipfs = require("ipfs-http-client");

/**
 * Generate mock releases in the different formats,
 * and try to retrieve and run them
 * - IPFS directory with docker-compose
 * - IPFS directory generate docker-compose from manifest
 * - IPFS manifest, generate docker-compose from manifest
 */

const releaseDnpName = "mock-test.public.dappnode.eth";
const releaseVersion = "0.0.1";

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

function verifyFiles(): void {
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

async function cleanInstallationArtifacts(): Promise<void> {
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
async function prepareDirectoryTypeReleaseWithDockerCompose(): Promise<string> {
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
  expect(files.map(f => f.name)).to.deep.equal(
    filesToUpload,
    "Uploaded files do not match"
  );

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
async function prepareDirectoryTypeReleaseNoDockerCompose(): Promise<string> {
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
  expect(files.map(f => f.name)).to.deep.equal(
    filesToUpload,
    "Uploaded files do not match"
  );

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
async function prepareManifestTypeRelease(): Promise<string> {
  const uploadedFiles = await ipfsAddFromFs(
    path.join(buildFilesDir, imageFile)
  );
  const imageHash = uploadedFiles[0].hash;
  const imageSize = uploadedFiles[0].size;

  const manifestPath = path.join(buildFilesDir, manifestFileOld);
  const manifest: ManifestWithImage = JSON.parse(
    fs.readFileSync(manifestPath, "utf8")
  );
  if (!manifest.image) throw Error("No image in manifest");
  manifest.image.hash = imageHash;
  manifest.image.size = imageSize;

  const releaseHashManifest = await ipfsAddManifest(manifest);

  // Verify the uploaded files
  const manifestUploaded = await ipfs
    .cat({ hash: releaseHashManifest })
    .then(file => JSON.parse(file.toString()));
  expect(manifestUploaded).to.deep.equal(manifest, "Wrong uploaded manifest");

  return releaseHashManifest;
}

/**
 * Aggregate the three type of tests
 * - Directory-type, WITH docker-compose
 * - Directory-type, NO docker-compose
 * - Manifest-type
 *
 * [NOTE] There are different default `NAME` env values
 * in the different files that each release typeis using
 */

const releaseTests: {
  name: string;
  prepareRelease: () => Promise<string>;
  envValue: string;
}[] = [
  {
    name: "Directory-type, WITH docker-compose",
    prepareRelease: prepareDirectoryTypeReleaseWithDockerCompose,
    envValue: "From_Compose"
  },
  {
    name: "Directory-type, NO docker-compose",
    prepareRelease: prepareDirectoryTypeReleaseNoDockerCompose,
    envValue: "No_Hashes"
  },
  {
    name: "Manifest-type",
    prepareRelease: prepareManifestTypeRelease,
    envValue: "Normal_Name"
  }
];

describe("Release format tests", () => {
  before("Create DAppNode docker network", async () => {
    const dncoreNetwork = params.DNP_NETWORK_EXTERNAL_NAME;
    const networkExists = await shell(
      `docker network ls --filter name=${dncoreNetwork} -q`
    );
    if (!networkExists) await shell(`docker network create ${dncoreNetwork}`);
  });

  for (const releaseTest of releaseTests) {
    describe(releaseTest.name, () => {
      let releaseHash: string;

      before(async () => {
        await createTestDir();
        await cleanInstallationArtifacts();
        verifyFiles();
      });

      it("Should generate mock release and upload it", async () => {
        releaseHash = await releaseTest.prepareRelease();
        console.log(`Uploaded mock: ${releaseTest.name}\n  ${releaseHash}`);
      }).timeout(60 * 1000);

      it("Get the release", async () => {
        if (!releaseHash) throw Error("Previous test failed");

        const { result } = await calls.fetchPackageData({ id: releaseHash });

        expect(result.manifest.name).to.equal(
          releaseDnpName,
          "Wrong manifest name"
        );
        expect(result.manifest.version).to.equal(
          releaseVersion,
          "Wrong manifest version"
        );
      }).timeout(60 * 1000);

      it("Install the release", async () => {
        if (!releaseHash) throw Error("Previous test failed");

        await calls.installPackage({
          id: [releaseDnpName, releaseHash].join("@")
          // userSetEnvs: { [releaseDnpName]: { NAME: nameEnv } }
        });

        // Verify it is running correctly
        const { result } = await calls.logPackage({ id: releaseDnpName });
        expect(result).to.equal(
          `Hello, ${releaseTest.envValue} !`,
          `Wrong log from ${releaseDnpName} after installation`
        );
      }).timeout(60 * 1000);

      after("Clean installation artifacts", async () => {
        await cleanInstallationArtifacts();
      });
    });
  }

  after("Remove DAppNode docker network", async () => {
    await shell(`docker network remove ${params.DNP_NETWORK_EXTERNAL_NAME}`);
  });
});

/**
 * Util, IPFS wrapper with type info
 */

type IpfsAddResult = {
  path: string;
  hash: string;
  size: number;
}[];

/**
 * Uploads a directory / file from the local filesystem
 * This should be part of the `DAppNodeSDK`
 */
function ipfsAddFromFs(
  path: string,
  options?: { recursive: boolean }
): Promise<IpfsAddResult> {
  if (!fs.existsSync(path))
    throw Error(`ipfs.addFromFs error: no file found at: ${path}`);
  return ipfsRaw.addFromFs(path, options);
}

function ipfsAddDirFromFs(path: string): Promise<string> {
  return ipfsAddFromFs(path, { recursive: true }).then(findRootHash);
}

/**
 * Uploads a manifest from memory
 * This should be part of the `DAppNodeSDK`
 */
async function ipfsAddManifest(manifest: Manifest): Promise<string> {
  const content = Ipfs.Buffer.from(JSON.stringify(manifest, null, 2));
  const results: IpfsAddResult = await ipfsRaw.add(content);
  return results[0].hash;
}

/**
 * Returns the root IPFS hash of a directory upload
 *
 * Sample @param uploadedFiles: [
 *  { path: 'release-directory-docker-compose/dappnode_package-no-hashes.json',
 *    hash: 'QmZ5sKqDtgV4J8DM8D1RUziNrsC2Sx8hRw5NXFU8LctJRN',
 *    size: 338 },
 *  { path: 'release-directory-docker-compose/docker-compose-mock-test.yml',
 *    hash: 'QmTp5Rb3k2cyzN7gZpUe4zQ6cMV3FoWJDxJUVfLZDsXhfo',
 *    size: 135 },
 *  { path: 'release-directory-docker-compose/mock-test.public.dappnode.eth_0.0.1.tar.xz',
 *    hash: 'QmP1CbEd5WTUqqKeDxvaDg9noPQNtcpKmcXj3zsqZyKKo8',
 *    size: 637642 },
 *  { path: 'release-directory-docker-compose',
 *    hash: 'QmaRXWSyst18BPyjKiMMKzn94krYEKZaoyVsyoPxh8PzjG',
 *    size: 638350 }
 * ]
 *
 * Sample return of `path.parse`
 * > path.parse("test/a.json")
 * { root: '', dir: 'test', base: 'a.json', ext: '.json', name: 'a' }
 * > path.parse("a.json")
 * { root: '', dir: '', base: 'a.json', ext: '.json', name: 'a' }
 * > path.parse("test")
 * { root: '', dir: '', base: 'test', ext: '', name: 'test' }
 */
function findRootHash(uploadedFiles: IpfsAddResult): string {
  const rootEntries = uploadedFiles.filter(e => !path.parse(e.path).dir);
  if (rootEntries.length === 1) return rootEntries[0].hash;
  else {
    console.log(uploadedFiles);
    throw Error("No releaseEntry found in uploaded release files");
  }
}
