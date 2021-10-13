import { ipfs } from "../ipfs";
import { parseManifest, validateManifestBasic } from "../manifest";
import { Manifest } from "../../types";
import { isDirectoryRelease } from "./ipfs/isDirectoryRelease";

export async function getManifest(contentUri: string): Promise<Manifest> {
  let data: string;
  try {
    const ipfsEntries = await ipfs.list(contentUri);
    const isDirectory = await isDirectoryRelease(ipfsEntries);
    if (isDirectory) {
      data = await ipfs.writeFileToMemory(
        `${contentUri}/dappnode_package.json`
      );
    } else {
      data = await ipfs.writeFileToMemory(contentUri);
    }
  } catch (e) {
    throw e;
  }

  return validateManifestBasic(parseManifest(data));
}
