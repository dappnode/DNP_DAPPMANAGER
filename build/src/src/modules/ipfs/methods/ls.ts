import ipfs from "../ipfsSetup";
import params from "../../../params";
import { timeoutError, IpfsArgument } from "../data";
import Logs from "../../../logs";
const logs = Logs(module);

interface IpfsLsFileResult {
  name: string; // 'avatar.png',
  path: string; // 'QmR7ALYdVQCSfdob9tzE8mvPn3KJk653maMqLeqMo7eeTg/avatar.png',
  size: number; // 9305,
  hash: string; // 'QmRFfqN93JN5hDfqWhxaY6M16dafS6t9qzRCAKzzNT9ved',
  type: string; // 'file',
  depth: number; // 1
}

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param {string} hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param {object} options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns {buffer} hash contents as a buffer
 */
export default function cat({
  hash
}: IpfsArgument): Promise<IpfsLsFileResult[]> {
  return new Promise(
    (resolve, reject): void => {
      // Timeout cancel mechanism
      const timeoutToCancel = setTimeout(() => {
        reject(Error(timeoutError));
      }, params.IPFS_TIMEOUT);

      ipfs.ls(hash, { sort: true }, (err: Error, data: IpfsLsFileResult[]) => {
        clearTimeout(timeoutToCancel);
        if (err) return reject(err);

        // Pin files after a successful download
        ipfs.pin.add(hash, (err: Error) => {
          if (err) logs.error(`Error pinning hash ${hash}: ${err.stack}`);
        });

        resolve(data);
      });
    }
  );
}
