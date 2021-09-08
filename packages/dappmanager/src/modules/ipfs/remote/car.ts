import { IpfsGateway, IpfsContentFromGateway } from "./IpfsGateway";
import params from "../../../params";
import { unpack, UnixFSEntry } from "ipfs-car/unpack";
import { logs } from "../../../logs";

export async function getPackageFromIpfsGateway(
  ipfsPath: string
): Promise<UnixFSEntry[]> {
  try {
    const ipfsGateway = new IpfsGateway(params.IPFS_HOST_GATEWAY);

    const cid = await ipfsGateway.resolveCid(ipfsPath);
    const carReader = await ipfsGateway.getCarReader(cid);
    const carReaderRoots = await ipfsGateway.getCarReaderRoots(carReader);
    const carReaderBlock = await ipfsGateway.getCarReaderBlock(
      carReader,
      carReaderRoots
    );

    const packageContent = new IpfsContentFromGateway(
      cid,
      carReader,
      carReaderRoots,
      carReaderBlock
    );

    // IMPORTANT! throw error if not verified content
    if (!packageContent.isVerified)
      throw Error(`CIDs are not equal, content is not trusted.`);

    const dirContent: UnixFSEntry[] = [];

    try {
      for await (const item of unpack(packageContent.carReader)) {
        dirContent.push(item);
      }
    } catch (e) {
      logs.error(`Error unpacking content. ${e}`);
      throw e;
    }

    return dirContent;
  } catch (e) {
    throw Error(`Error getting content package from ipfs gateway. ${e}`);
  }
}

/* async function getFileFromCarReader() {
  try {
    const content = item.content();
    for await (const item of content) {
      const buff = Buffer.from(item);
    }
  } catch (e) {
    throw Error(`Error writing file ${file.name} to disk. ${e}`);
  }
}

async function writeFile(): Promise<void> {} */
