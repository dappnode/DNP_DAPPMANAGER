import { ipfs } from "../ipfs";
import { parseManifest, validateManifestBasic } from "../manifest";
import { Manifest } from "../../types";

export async function getManifest(contentUri: string): Promise<Manifest> {
  let data: string;
  try {
    data = await ipfs.catString(contentUri);
  } catch (e) {
    if (e.message.includes("is a directory")) {
      data = await ipfs.catString(`${contentUri}/dappnode_package.json`);
    } else {
      throw e;
    }
  }

  return validateManifestBasic(parseManifest(data));
}
