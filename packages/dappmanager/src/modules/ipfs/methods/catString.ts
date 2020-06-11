import ipfsCat from "./cat";

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns hash contents as a buffer
 */
export default async function catString({
  hash,
  maxLength
}: {
  hash: string;
  maxLength?: number;
}): Promise<string> {
  return ipfsCat({ hash, maxLength }).then(file => file.toString());
}
