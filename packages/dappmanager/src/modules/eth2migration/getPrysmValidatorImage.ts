import { imagesList } from "../docker/api";
import { Eth2Network } from "./params";
import semver from "semver";

/**
 * Fetch _SOME_ image from the available prysm package
 * MUST be fetched dynamically here because we don't know when user will do the migration
 * They may have an old version of Prysm or a newer version of Prysm.
 * @param prysmOldDnpName
 * ```
 * validator.prysm.dnp.dappnode.eth:0.1.5
 * ```
 */
export async function getPrysmValidatorImage({
  prysmOldDnpName,
  network
}: {
  prysmOldDnpName: string;
  network: Eth2Network;
}): Promise<string> {
  // TODO: determine stable versions that support the prysm cli used in the eth2migration
  const prysmStableVersion = network === "mainnet" ? "1.0.22" : "0.1.7";
  // TODO: To ensure that the Prysm validator API is stable and works as expected,
  // ensure that the available prysm image is within some expected version range
  const dockerImages = await imagesList();

  // Get docker imageName and imageVersion that match the prysmOldDnpName and is equal to prysmStableVersion
  const prysmImage = dockerImages
    .map(image => {
      return image.RepoTags.find(tag => {
        const [imageName, imageVersion] = tag.split(":");
        return (
          imageName === prysmOldDnpName &&
          semver.valid(imageVersion) &&
          semver.valid(prysmStableVersion) &&
          semver.eq(imageVersion, prysmStableVersion)
        );
      });
    })
    ?.join(":");

  if (!prysmImage)
    throw new Error(
      `Could not find a stable validator image for ${prysmOldDnpName} compatible with the CLI used in the eth2migrate`
    );

  return prysmImage;
}
