import fs from "fs";
import { isAbsolute } from "path";
import { TimeoutErrorKy, IpfsInstance } from "./types.js";
import { getContentFromGateway } from "./getContentFromGateway.js";
import { CarReader } from "@ipld/car";
import { unpack } from "ipfs-car/unpack";
import type { Readable } from "stream";
import { pipeline } from "stream/promises";

const resolution = 2;
const timeoutMaxDownloadTime = 5 * 60 * 1000;

export interface CatStreamToFsArgs {
  hash: string;
  path: string;
  timeout?: number;
  fileSize?: number;
  progress?: (n: number) => void;
}

async function downloadIPFSContentToFS(
  readable: AsyncIterable<Uint8Array>,
  { path, timeout, fileSize, progress }: CatStreamToFsArgs
): Promise<void> {
  return new Promise(async (resolve, reject): Promise<void> => {
    if (!path || path.startsWith("/ipfs/") || !isAbsolute(path)) {
      reject(Error(`Invalid path: "${path}"`));
    }

    const asyncIterableArray: Uint8Array[] = [];

    // Timeout cancel mechanism
    const timeoutToCancel = setTimeout(() => {
      reject(TimeoutErrorKy);
    }, timeout || 30 * 1000);

    let totalData = 0;
    let previousProgress = -1;
    const resolution = 1;
    const round = (n: number): number =>
      resolution * Math.round((100 * n) / resolution);

    const onData = (chunk: Uint8Array): void => {
      clearTimeout(timeoutToCancel);
      totalData += chunk.length;
      asyncIterableArray.push(chunk);
      if (progress && fileSize) {
        const currentProgress = round(totalData / fileSize);
        if (currentProgress !== previousProgress) {
          progress(currentProgress);
          previousProgress = currentProgress;
        }
      }
    };

    const onFinish = (): void => {
      clearTimeout(timeoutToCancel);
      resolve();
    };

    const onError =
      (streamId: string) =>
      (err: Error): void => {
        clearTimeout(timeoutToCancel);
        reject(Error(streamId + ": " + err));
      };

    try {
      for await (const chunk of readable) onData(chunk);

      const writable = fs.createWriteStream(path);
      await pipeline(asyncIterableArray, writable);
      onFinish();
    } catch (e) {
      onError("Error writing to fs")(e);
    }
  });
}

/**
 * LOCAL-API
 * Streams an IPFS object to the local fs.
 * If the stream does not start within the specified timeout,
 * it will throw and error. This utility does not verify the file
 *
 * @param hash "QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ"
 * @param path "/usr/src/path-to-file/file.ext"
 * @param options Available options:
 * - onChunk: {function} Gets called on every received chuck
 *   function(chunk) {}
 */
export async function catStreamToFs(
  args: CatStreamToFsArgs,
  ipfs: IpfsInstance
): Promise<void> {
  await downloadIPFSContentToFS(ipfs.cat(args.hash), args);
}

/**
 * REMOTE-GATEWAY
 * Writes CarReader to the fs
 */
export async function writeCarToFs(
  args: CatStreamToFsArgs,
  ipfs: IpfsInstance
): Promise<void> {
  const content = await getContentFromGateway(ipfs, args.hash);
  const fileIterable = await unpackFileFromCarReader(content.carReader);

  await downloadIPFSContentToFS(fileIterable, args);
}

async function unpackFileFromCarReader(
  carReader: CarReader
): Promise<AsyncIterable<Uint8Array>> {
  const filesIterables = [];
  try {
    for await (const unixFsEntry of unpack(carReader)) {
      if (unixFsEntry.type === "file") {
        filesIterables.push(unixFsEntry.content());
      } else {
        throw Error(`Expexted type: file. Got: ${unixFsEntry.type}`);
      }
    }

    if (filesIterables.length > 1)
      throw Error(`Unexpected number of files. There must be only one`);

    return filesIterables[0];
  } catch (e) {
    throw e;
  }
}
