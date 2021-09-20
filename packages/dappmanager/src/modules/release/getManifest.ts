import { ipfs } from "../ipfs";
import { parseManifest, validateManifestBasic } from "../manifest";
import { Manifest } from "../../types";
import { isDirectoryRelease } from "./ipfs/isDirectoryRelease";

export async function getManifest(contentUri: string): Promise<Manifest> {
  let data: string;
  try {
    const files = await ipfs.ls(contentUri);
    const isDirectory = await isDirectoryRelease(files);
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
