import { isEqual } from "lodash-es";
import { ipfs } from "../../../src/modules/ipfs";
import { parseManifest } from "../../../src/modules/manifest";
import { ManifestWithImage } from "../../../src/types";
import { ipfsAddManifest, ipfsAddFileFromFs } from "../testIpfsUtils";
import { saveNewImageToDisk } from "./mockImage";

/**
 * Release type: `Manifest-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns releaseHash
 */
export async function uploadManifestRelease(
  manifest: ManifestWithImage
): Promise<string> {
  if (!manifest.image) throw Error("No image in manifest");

  const imagePath = await saveNewImageToDisk({
    dnpName: manifest.name,
    version: manifest.version,
    serviceNames: [manifest.name]
  });

  const fileUploaded = await ipfsAddFileFromFs(imagePath);
  manifest.image.hash = fileUploaded.cid.toString();
  manifest.image.size = fileUploaded.size;

  const releaseHashManifest = await ipfsAddManifest(manifest);

  // Verify the uploaded files
  const data = await ipfs.writeFileToMemory(releaseHashManifest);
  const manifestUploaded = parseManifest(data);

  if (!isEqual(manifestUploaded, manifest)) {
    throw Error("Wrong uploaded manifest");
  }

  return releaseHashManifest;
}
