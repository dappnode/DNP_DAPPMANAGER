import { Eth2Network, Eth2Client } from "./params";
import params from "../../params";

import { imagesList } from "../docker/api";
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
export async function getPrysmOldValidatorImage({
  prysmOldDnpName,
  prysmOldStableVersion
}: {
  prysmOldDnpName: string;
  prysmOldStableVersion: string;
}): Promise<string> {
  // TODO: To ensure that the Prysm validator API is stable and works as expected,
  // ensure that the available prysm image is within some expected version range
  const dockerImages = await imagesList();

  // Get docker imageName and imageVersion that match the prysmOldDnpName and is equal to prysmOldStableVersion
  const prysmImage = dockerImages
    .map(image => {
      return image.RepoTags.find(tag => {
        const [imageName, imageVersion] = tag.split(":");
        return (
          imageName === prysmOldDnpName &&
          semver.valid(imageVersion) &&
          semver.valid(prysmOldStableVersion) &&
          semver.eq(imageVersion, prysmOldStableVersion)
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

/**
 * Get dnpname, container and network of eth2 client validator
 * @param client
 * @param testnet
 * @returns {dnpName, containerName, network}
 *  Example:
 * [ I ]
 *    - network: "mainnet"
 *    - dnpName: "prysm.dnp.dappnode.eth"
 *    - containerName: "DAppNodePackage-validator.prysm.dnp.dappnode.eth"
 * [ II ]
 *    - network: "prater"
 *    - dnpName: "prater.dnp.dappnode.eth"
 *    - containerName: "DAppNodePackage-validator.prysm.dnp.dappnode.eth"
 */
export function getMigrationParams(
  client: Eth2Client,
  network: Eth2Network
): {
  newEth2ClientDnpName: string;
  prysmOldDnpName: string;
  prysmOldValidatorContainerName: string;
  prysmOldValidatorVolumeName: string;
  prysmOldStableVersion: string;
  signerDnpName: string;
  signerContainerName: string;
} {
  const prysmOld = getPrysmOldData(network);
  const newEth2Client = getNewEth2Client(client, network);
  const eth2Web3Signer = getEth2Web3Signer(network);

  return {
    prysmOldDnpName: prysmOld.dnpName,
    prysmOldValidatorContainerName: prysmOld.validatorContainerName,
    prysmOldValidatorVolumeName: prysmOld.validatorContainerName,
    prysmOldStableVersion: prysmOld.legacyVersion,
    newEth2ClientDnpName: newEth2Client.dnpName,
    signerDnpName: eth2Web3Signer.dnpName,
    signerContainerName: eth2Web3Signer.signerContainerName
  };
}

function getPrysmOldData(network: Eth2Network): {
  dnpName: string;
  validatorContainerName: string;
  prysmValidatorVolumeName: string;
  legacyVersion: string;
} {
  // TODO: determine stable versions that support the prysm cli used in the eth2migration
  switch (network) {
    case "mainnet":
      return {
        dnpName: "prysm.dnp.dappnode.eth",
        validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm.dnp.dappnode.eth`,
        prysmValidatorVolumeName: "prysm-praterdnpdappnodeeth_validator-data",
        legacyVersion: "1.0.22" // Version that supports the validator cli for the migration
      };
    case "prater":
      return {
        dnpName: "prysm-prater.dnp.dappnode.eth",
        validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm-prater.dnp.dappnode.eth`,
        prysmValidatorVolumeName: "prysm-praterdnpdappnodeeth_validator-data",
        legacyVersion: "0.1.7" // Version that supports the validator cli for the migration
      };
    default:
      throw Error(`Network ${network} not supported`);
  }
}

function getNewEth2Client(
  client: Eth2Client,
  network: Eth2Network
): {
  dnpName: string;
  validatorContainerName: string;
} {
  switch (client) {
    case "prysm":
      switch (network) {
        case "mainnet":
          return {
            dnpName: "prysm.dnp.dappnode.eth",
            validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm.dnp.dappnode.eth`
          };
        case "prater":
          return {
            dnpName: "prysm-prater.dnp.dappnode.eth",
            validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm-prater.dnp.dappnode.eth`
          };
      }

    case "lighthouse":
    case "teku":
    default:
      throw Error(`Client ${client} not supported`);
  }
}

function getEth2Web3Signer(network: Eth2Network): {
  dnpName: string;
  signerContainerName: string;
} {
  switch (network) {
    case "mainnet":
      return {
        dnpName: "web3signer.dnp.dappnode.eth",
        signerContainerName: `${params.CONTAINER_NAME_PREFIX}-signer.web3signer.dnp.dappnode.eth`
      };
    case "prater":
      return {
        dnpName: "web3signer-prater.dnp.dappnode.eth",
        signerContainerName: `${params.CONTAINER_NAME_PREFIX}-signer.web3signer-prater.dnp.dappnode.eth`
      };
    default:
      throw Error(`Network ${network} not supported`);
  }
}
