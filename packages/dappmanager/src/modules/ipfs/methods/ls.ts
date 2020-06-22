import ipfs, { timeoutMs } from "../ipfsSetup";
import { pinAddNoThrow } from "./pinAdd";

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
 * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
 * @param options Available options:
 * - maxLength: specifies a length to read from the stream.
 *   if reached, it will throw an error
 * @returns hash contents as a buffer
 */
export default async function ls({
  hash
}: {
  hash: string;
}): Promise<IpfsLsFileResult[]> {
  const files = [];
  for await (const file of ipfs.ls(hash, { timeout: timeoutMs })) {
    files.push(file);
  }

  // Pin files after a successful download
  pinAddNoThrow({ hash });

  // {
  //   depth: 1,
  //   name: 'alice.txt',
  //   path: 'QmVvjDy7yF7hdnqE8Hrf4MHo5ABDtb5AbX6hWbD3Y42bXP/alice.txt',
  //   size: 11696,
  //   cid: CID('QmZyUEQVuRK3XV7L9Dk26pg6RVSgaYkiSTEdnT2kZZdwoi'),
  //   type: 'file',
  //   mode: Number,
  //   mtime: { secs: Number, nsecs: Number }
  // }
  return files.map(file => ({
    name: file.name,
    path: file.path,
    size: file.size,
    hash: file.cid.toString(),
    type: file.type,
    depth: file.depth
  }));
}
