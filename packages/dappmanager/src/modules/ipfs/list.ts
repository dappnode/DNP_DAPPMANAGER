import { IPFSEntry } from "ipfs-core-types/src/root";
import { IpfsInstance, IpfsDagGet } from "./types";
import { sanitizeIpfsPath } from "./utils";
import path from "path";
import { CID } from "ipfs-http-client";

/**
 * LOCAL
 * List items in CID using API endpoit /ls
 * @param ipfs
 * @param timeout
 * @param hash
 */
export async function ls(
  ipfs: IpfsInstance,
  timeout: number,
  hash: string
): Promise<IPFSEntry[]> {
  const files: IPFSEntry[] = [];
  for await (const file of ipfs.ls(hash, {
    timeout: timeout
  })) {
    files.push(file);
  }
  return files;
}

/**
 * REMOTE
 * List items in CID using Gateway endpoint /dag/get
 * @param ipfs
 * @param hash
 */
export async function dagGet(
  ipfs: IpfsInstance,
  hash: string
): Promise<IPFSEntry[]> {
  const files: IPFSEntry[] = [];
  const hashSanitized = sanitizeIpfsPath(hash);
  const cid = CID.parse(hashSanitized);
  const content = await ipfs.dag.get(cid);
  const contentLinks: IpfsDagGet[] = content.value.Links;
  if (!contentLinks)
    throw Error(`hash ${hashSanitized} does not contain links`);
  contentLinks.map(link => {
    if (!cid) throw Error("Error getting cid");
    files.push({
      type: "file",
      cid: CID.parse(sanitizeIpfsPath(link.Hash.toString())),
      name: link.Name,
      path: path.join(link.Hash.toString(), link.Name),
      size: link.Size
    });
  });
  return files;
}
