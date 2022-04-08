import { ipfs } from "../ipfs";
import { parseManifest, validateManifestBasic } from "../manifest";
import { Manifest } from "../../types";
import { IpfsClientTarget } from "../../common";
import { releaseFiles } from "../../params";

export async function getManifest(contentUri: string): Promise<Manifest> {
  try {
    const ipfsEntries = await ipfs.list(contentUri);

    if (ipfs.ipfsClientTarget === IpfsClientTarget.remote) {
      const manifestPath = ipfsEntries.find(file =>
        releaseFiles.manifest.regex.test(file.name)
      );
      if (!manifestPath) throw Error("Manifest not found using IPFS gateway");
      // The ipfs dag.export method does not allow hash using "path" format
      return validateManifestBasic(
        parseManifest(await ipfs.writeFileToMemory(manifestPath.cid.toString()))
      );
    } else {
      // The ipfs cat method does allow to use hash using "path" format
      return validateManifestBasic(
        parseManifest(
          await ipfs.writeFileToMemory(`${contentUri}/dappnode_package.json`)
        )
      );
    }
  } catch (e) {
    throw e;
  }
}
