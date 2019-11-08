import fs from "fs";
import { isAbsolute } from "path";
import ipfs from "../ipfsSetup";
import params from "../../../params";
import { timeoutError } from "../data";
import Logs from "../../../logs";
const logs = Logs(module);

const timeoutMs = params.IPFS_TIMEOUT || 2000;
const resolution = 2;

/**
 * Streams an IPFS object to the local fs.
 * If the stream does not start within the specified timeout,
 * it will throw and error. This utility does not verify the file
 *
 * @param {string} hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param {string} path "/usr/src/path-to-file/file.ext"
 * @param {object} options Available options:
 * - onChunk: {function} Gets called on every received chuck
 *   function(chunk) {}
 */
export default function catStreamToFs({
  hash,
  path,
  fileSize,
  progress
}: {
  hash: string;
  path: string;
  fileSize?: number;
  progress?: (n: number) => void;
}): Promise<string> {
  return new Promise(
    (resolve, reject): void => {
      if (!path || path.startsWith("/ipfs/") || !isAbsolute("/"))
        reject(Error(`Invalid path: "${path}"`));

      // Timeout cancel mechanism
      const timeoutToCancel = setTimeout(() => {
        reject(Error(timeoutError));
      }, timeoutMs);

      const onError = (streamId: string) => (err: Error): void => {
        clearTimeout(timeoutToCancel);
        reject(Error(streamId + ": " + err));
      };

      let totalData = 0;
      let previousProgress = -1;
      const round = (n: number): number =>
        resolution * Math.round((100 * n) / resolution);

      const onData = (chunk: Buffer): void => {
        clearTimeout(timeoutToCancel);
        totalData += chunk.length;
        if (progress && fileSize) {
          const currentProgress = round(totalData / fileSize);
          if (currentProgress !== previousProgress) {
            progress(currentProgress);
            previousProgress = currentProgress;
          }
        }
      };

      const onFinish = (data: string): void => {
        clearTimeout(timeoutToCancel);
        // Pin files after a successful download
        ipfs.pin.add(hash, (err: Error) => {
          if (err) logs.error(`Error pinning hash ${hash}: ${err.stack}`);
        });
        resolve(data);
      };

      const readStream = ipfs
        .catReadableStream(hash)
        .on("data", onData)
        .on("error", onError("ReadableStream"));
      const writeStream = fs
        .createWriteStream(path)
        .on("finish", onFinish)
        .on("error", onError("WriteStream"));
      readStream.pipe(writeStream);
    }
  );
}
