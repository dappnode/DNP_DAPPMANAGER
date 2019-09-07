import downloadImage from "./ipfs/downloadImage";

export default async function getImage(
  hash: string,
  path: string,
  fileSize: number,
  progress: (n: number) => void
): Promise<void> {
  return await downloadImage(hash, path, fileSize, progress);
}
