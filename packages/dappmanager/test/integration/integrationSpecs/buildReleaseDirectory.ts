import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { mapValues } from "lodash-es";
import { ipfs } from "../../../src/modules/ipfs";
import shell from "../../../src/utils/shell";
import { yamlDump } from "../../../src/utils/yaml";
import { getContainerName, getImageTag } from "../../../src/params";
import {
  Manifest,
  Compose,
  SetupWizard,
  ComposeService
} from "@dappnode/dappnodesdk";
import { testDir, manifestFileName, composeFileName } from "../../testUtils";
import { ipfsAddAll } from "../testIpfsUtils";
import { saveNewImageToDisk } from "./mockImage";
import { saveMockAvatarTo } from "./mockAvatar";
import { signRelease } from "./signRelease";

// Helper type to prevent having to write valid container_name, image per service
type ComposeUncomplete = Omit<Compose, "services"> & {
  services: {
    [serviceName: string]: Omit<ComposeService, "container_name" | "image">;
  };
};

/**
 * Release type: `Directory-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns releaseHash
 */
export async function uploadDirectoryRelease({
  manifest,
  compose,
  setupWizard,
  disclaimer,
  signReleaseWithPrivKey
}: {
  manifest: Manifest;
  compose: ComposeUncomplete;
  setupWizard?: SetupWizard;
  disclaimer?: string;
  signReleaseWithPrivKey?: string;
}): Promise<string> {
  const releaseDir = path.join(testDir, manifest.name);
  await shell(`rm -rf ${releaseDir}`); // Clean dir before populating
  fs.mkdirSync(releaseDir, { recursive: true });

  const writeAsset = (fileName: string, data: string): void =>
    fs.writeFileSync(path.join(releaseDir, fileName), data);
  const writeJson = <T>(fileName: string, jsonData: T): void =>
    writeAsset(fileName, JSON.stringify(jsonData, null, 2));

  writeJson(manifestFileName, manifest); // Manifest
  writeAsset(composeFileName, yamlDump(completeCompose(compose, manifest))); // Compose
  saveMockAvatarTo(path.join(releaseDir, "avatar.png")); // Avatar
  // const filesToUpload = [manifestFileNoImage, composeFile, imageFile];
  const serviceNames = Object.keys(compose.services);
  await saveNewImageToDisk(
    { dnpName: manifest.name, version: manifest.version, serviceNames },
    releaseDir
  );

  // Other optional files
  if (setupWizard) writeJson("setup-wizard.json", setupWizard);
  if (disclaimer) writeAsset("disclaimer.md", disclaimer);

  const addResults = await ipfsAddAll(releaseDir);
  // The last result is the root /test_files, the second is the dir /test_files/something/
  const rootHash = addResults[addResults.length - 2].cid.toString();

  // Verify the uploaded files
  const files = await ipfs.list(rootHash);
  const fileNames = files.map(file => file.name);
  for (const fileToCheck of [manifestFileName, composeFileName])
    if (!fileNames.includes(fileToCheck))
      throw Error(`No ${fileToCheck} uploaded`);

  if (signReleaseWithPrivKey) {
    const wallet = new ethers.Wallet(signReleaseWithPrivKey);
    return await signRelease(wallet, ipfs, rootHash);
  } else {
    return rootHash;
  }
}

/**
 * Utility to write valid compose files
 * prevents having to write valid container_name, image per service
 */
export function completeCompose(
  composeUncomplete: ComposeUncomplete,
  manifest: Manifest
): Compose {
  const dnpName = manifest.name;
  const version = manifest.version;
  const isCore = manifest.type === "dncore";
  return {
    ...composeUncomplete,
    services: mapValues(composeUncomplete.services, (service, serviceName) => ({
      container_name: getContainerName({ dnpName, serviceName, isCore }),
      image: getImageTag({ dnpName, serviceName, version }),
      ...service
    }))
  };
}
