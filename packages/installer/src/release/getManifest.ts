import { ipfs, IPFSEntry } from "@dappnode/ipfs";
import { parseManifest, validateManifestBasic } from "@dappnode/manifest";
import { IpfsClientTarget, Manifest, releaseFiles } from "@dappnode/common";

export async function getManifest(contentUri: string): Promise<Manifest> {
  const ipfsEntries = await ipfs.list(contentUri);
  const data = await getManifestFromDir(ipfsEntries, contentUri);

  return validateManifestBasic(parseManifest(data));
}

async function getManifestFromDir(
  ipfsEntries: IPFSEntry[],
  contentUri: string
): Promise<string> {
  if (ipfs.ipfsClientTarget === IpfsClientTarget.remote) {
    const manifestPath = ipfsEntries.find((file) =>
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
