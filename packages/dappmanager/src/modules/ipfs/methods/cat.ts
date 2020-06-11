import ipfs, { timeoutMs } from "../ipfsSetup";
import { pinAddNoThrow } from "./pinAdd";

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns hash contents as a buffer
 */
export default async function cat({
  hash,
  maxLength
}: {
  hash: string;
  maxLength?: number;
}): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of ipfs.cat(hash, {
    length: maxLength,
    timeout: timeoutMs
  })) {
    chunks.push(chunk);
  }
  const data = Buffer.concat(chunks);

  if (data.length === maxLength)
    throw Error(`Maximum size exceeded (${maxLength} bytes)`);

  // Pin files after a successful download
  pinAddNoThrow({ hash });

  return data;
}
