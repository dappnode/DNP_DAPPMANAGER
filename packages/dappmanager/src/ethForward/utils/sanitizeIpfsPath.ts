/**
 * Cleans starting "ipfs" prefix of an IPFS path
 * @param ipfsPath "/ipfs://QmZZ6a6a6a"
 * @return "QmZZ6a6a6a"
 */
export function sanitizeIpfsPath(ipfsPath: string): string {
  return ipfsPath.split(/ipfs[\/\:]+/)[1] || ipfsPath;
}
