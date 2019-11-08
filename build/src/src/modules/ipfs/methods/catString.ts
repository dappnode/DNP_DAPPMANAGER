import ipfsCat from "./cat";

/**
 * Returns a file addressed by a valid IPFS Path.
 * @param {string} hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param {object} options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns {buffer} hash contents as a buffer
 */
export default function catString({
  hash,
  maxLength
}: {
  hash: string;
  maxLength?: number;
}): Promise<string> {
  return ipfsCat({ hash, maxLength }).then(file => file.toString());
}
