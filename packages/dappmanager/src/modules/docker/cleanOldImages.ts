import { valid, lt } from "semver";
import { imagesList, imageRemove } from "./api/index.js";

/**
 * Clean old semver tagged images for DNP `name` expect tag `version`.
 * If the images were removed successfuly the dappmanger will print logs:
 * Untagged: package.dnp.dappnode.eth:0.1.6
 */
export async function dockerCleanOldImages(
  dnpName: string,
  version: string
): Promise<void> {
  // Filtering by `reference` requires the repo name to be exact
  // This prevents catching all images of a multi-service package
  const repoImages = await imagesList();
  const imagesToDelete = repoImages.filter(
    image =>
      image.RepoTags &&
      image.RepoTags.every(tag => {
        const [imageName, imageVersion] = tag.split(":");
        return (
          (imageName === dnpName ||
            // Get multi-service images, but not mix `goerli-geth` with `goerli` for example
            imageName.endsWith("." + dnpName)) &&
          valid(imageVersion) &&
          valid(version) &&
          lt(imageVersion, version)
        );
      })
  );

  for (const image of imagesToDelete) {
    await imageRemove(image.Id);
  }
}
