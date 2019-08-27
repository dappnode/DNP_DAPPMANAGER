import ipfs from "../ipfsSetup";
import params from "../../../params";
import { timeoutError } from "../data";

interface IpfsObjectStats {
  Hash: string; // "QmaokAG8ECxpbLp4bqE6A3tBXsATZS7aN8RPd3DsE1haKz";
  NumLinks: number; // 19;
  BlockSize: number; // 921;
  LinksSize: number; // 838;
  DataSize: number; // 83;
  CumulativeSize: number; // 4873175;
}

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param {string} hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @returns {number} CumulativeSize of the ipfs object in bytes
 */
export default function objectSize(hash: string) {
  return new Promise((resolve, reject) => {
    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(Error(timeoutError));
    }, params.IPFS_TIMEOUT);

    /**
     * stats = {
     *   Hash: 'QmaokAG8ECxpbLp4bqE6A3tBXsATZS7aN8RPd3DsE1haKz',
     *   NumLinks: 19,
     *   BlockSize: 921,
     *   LinksSize: 838,
     *   DataSize: 83,
     *   CumulativeSize: 4873175
     * }
     */
    ipfs.object.stat(hash, (err: Error, stats: IpfsObjectStats) => {
      clearTimeout(timeoutToCancel);
      if (err) reject(err);
      else resolve(stats.CumulativeSize);
    });
  });
}
