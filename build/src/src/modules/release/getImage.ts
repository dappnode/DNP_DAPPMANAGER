import downloadImage from "./ipfs/downloadImage";
import { DistributedFile } from "../../types";
import { dockerImageManifest } from "../docker/dockerCommands";

export default async function getImage(
  imageFile: DistributedFile,
  path: string,
  progress: (n: number) => void
): Promise<void> {
  const { hash, size } = imageFile;
  return await downloadImage(hash, path, size, progress);
}

/**
 * Verify that the docker image tar.xz:
 * - Contains only one image
 * - Has the expected name
 */
export async function verifyDockerImage({
  imagePath,
  name,
  version
}: {
  imagePath: string;
  name: string;
  version: string;
}) {
  const images = await dockerImageManifest(imagePath);
  if (images.length !== 1)
    throw Error("image tarball must contain strictly one image");
  const imageTag = images[0].RepoTags[0];
  if (imageTag !== `${name}:${version}`)
    throw Error(`Wrong image tag ${imageTag}`);
}
