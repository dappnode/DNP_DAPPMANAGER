import ipfs, { timeoutMs } from "../ipfsSetup";

interface IpfsObjectStats {
  Hash: string; // "QmaokAG8ECxpbLp4bqE6A3tBXsATZS7aN8RPd3DsE1haKz";
  NumLinks: number; // 19;
  BlockSize: number; // 921;
  LinksSize: number; // 838;
  DataSize: number; // 83;
  CumulativeSize: number; // 4873175;
}

/**
 * Returns stats about an IPFS Object
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @returns CumulativeSize of the ipfs object in bytes
 */
export default async function objectSize(hash: string): Promise<number> {
  const stats: IpfsObjectStats = await ipfs.object.stat(hash, {
    timeout: timeoutMs
  });
  return stats.CumulativeSize;
}
