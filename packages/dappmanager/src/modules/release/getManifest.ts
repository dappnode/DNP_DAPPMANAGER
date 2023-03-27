import { ipfs, IPFSEntry } from "../ipfs/index.js";
import { parseManifest, validateManifestBasic } from "../manifest/index.js";
import { Manifest, releaseFiles } from "@dappnode/dappnodesdk/exports";
import { isDirectoryRelease } from "./ipfs/isDirectoryRelease.js";
import { IpfsClientTarget } from "@dappnode/common";

export async function getManifest(contentUri: string): Promise<Manifest> {
  let data: string;
  try {
    const ipfsEntries = await ipfs.list(contentUri);
    const isDirectory = await isDirectoryRelease(ipfsEntries);
    if (isDirectory) {
      data = await getManifestFromDir(ipfsEntries, contentUri);
    } else {
      data = await ipfs.writeFileToMemory(contentUri);
    }
  } catch (e) {
    throw e;
  }

  return validateManifestBasic(parseManifest(data));
}

async function getManifestFromDir(
  ipfsEntries: IPFSEntry[],
  contentUri: string
): Promise<string> {
  if (ipfs.ipfsClientTarget === IpfsClientTarget.remote) {
    const manifestPath = ipfsEntries.find(file =>
      releaseFiles.manifest.regex.test(file.name)
    );
    if (!manifestPath) throw Error("Manifest not found using IPFS gateway");
    // The ipfs dag.export method does not allow hash using "path" format
    return await ipfs.writeFileToMemory(manifestPath.cid.toString());
  } else {
    // The ipfs cat method does allow to use hash using "path" format
    return await ipfs.writeFileToMemory(`${contentUri}/dappnode_package.json`);
  }
}
