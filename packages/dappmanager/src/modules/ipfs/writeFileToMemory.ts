import { IpfsInstance, IpfsCatOptions } from "./types.js";
import { getContentFromGateway } from "./getContentFromGateway.js";
import { recursive as exporter } from "ipfs-unixfs-exporter";
import { handleIpfsError } from "./utils.js";

/**
 * REMOTE-GATEWAY
 * Used by IPFS REMOTE mode to keep carReader from an IPFS gateway in memory
 * @param ipfsPath "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @returns hash contents as a buffer
 */
export async function catCarReaderToMemory(
  ipfs: IpfsInstance,
  hash: string,
  opts?: IpfsCatOptions
): Promise<Buffer> {
  const chunks = [];

  const content = await getContentFromGateway(ipfs, hash);
  const roots = await content.carReader.getRoots();
  const entries = exporter(roots[0], {
    async get(cid) {
      const block = await content.carReader.get(cid);
      return block.bytes;
    }
  });

  for await (const entry of entries) {
    const content = entry.content();
    for await (const chunk of content) {
      chunks.push(chunk);
    }
  }

  const data = Buffer.concat(chunks);
  if (opts?.maxLength && data.length >= opts.maxLength)
    throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

  return data;
}

/**
 * LOCAL-API
 * Parses a file addressed by a valid IPFS Path.
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns hash contents as a buffer
 * Downloads and parses buffer to UTF8
 * @see cat
 */
export async function catString(
  ipfs: IpfsInstance,
  hash: string,
  timeout: number,
  opts?: IpfsCatOptions
): Promise<string> {
  const chunks = [];
  try {
    for await (const chunk of ipfs.cat(hash, {
      length: opts?.maxLength,
      timeout: timeout
    })) {
      chunks.push(chunk);
    }
  } catch (e) {
    handleIpfsError(e as Error, hash);
  }

  const buffer = Buffer.concat(chunks);
  if (opts?.maxLength && buffer.length >= opts.maxLength)
    throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

  return buffer.toString();
}
