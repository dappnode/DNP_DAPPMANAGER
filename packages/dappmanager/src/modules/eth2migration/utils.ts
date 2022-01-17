import { Eth2Network, Eth2Client } from "./params";
import params from "../../params";

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
    newEth2ClientDnpName: newEth2Client.dnpName,
    signerDnpName: eth2Web3Signer.dnpName,
    signerContainerName: eth2Web3Signer.signerContainerName
  };
}

function getPrysmOldData(network: Eth2Network): {
  dnpName: string;
  validatorContainerName: string;
  prysmValidatorVolumeName: string;
} {
  switch (network) {
    case "mainnet":
      return {
        dnpName: "prysm.dnp.dappnode.eth",
        validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm.dnp.dappnode.eth`,
        // TODO: Check in production DAppNode 'prysmdnpdappnodeeth_validator-data'
        prysmValidatorVolumeName: null
      };
    case "prater":
      return {
        dnpName: "prysm-prater.dnp.dappnode.eth",
        validatorContainerName: `${params.CONTAINER_NAME_PREFIX}-validator.prysm-prater.dnp.dappnode.eth`,
        prysmValidatorVolumeName: null
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
