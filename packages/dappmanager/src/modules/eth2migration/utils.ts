import { PackageContainer } from "../../types";
import { packageGet } from "../../calls";
import { docker } from "../docker/api/docker";
import Dockerode from "dockerode";
import { Eth2Network, eth2migrationParams } from "./params";

/**
 * Returns the validator container specs
 * @param dnpName
 * @param containerName
 */
export async function getValidatorContainerSpecs(
  dnpName: string,
  containerName: string
): Promise<{ container: PackageContainer; volume: Dockerode.Volume }> {
  const container = await getPrysmValidatorContainer(dnpName, containerName);
  const volume = await getPrysmValidatorVolumes(container);
  return {
    container,
    volume
  };
}

/**
 * Returns the container params deppending on
 * network: testnet | mainnet
 * @param testnet
 */
export function getMigrationParams(testnet: boolean): {
  network: Eth2Network;
  dnpName: string;
  containerName: string;
} {
  return {
    network: testnet ? "prater" : "mainnet",
    dnpName: testnet
      ? eth2migrationParams.testnet.clientDnpName
      : eth2migrationParams.mainnet.clientDnpName,
    containerName: testnet
      ? eth2migrationParams.testnet.validatorContainerName
      : eth2migrationParams.mainnet.validatorContainerName
  };
}

/**
 * Returns the prysm validator container
 * @param dnpName
 * @param containerName
 */
export async function getPrysmValidatorContainer(
  dnpName: string,
  containerName: string
): Promise<PackageContainer> {
  const prysmPackage = await packageGet({
    dnpName
  });

  const prysmValidatorContainer = prysmPackage.containers.find(
    container => container.containerName === containerName
  );
  if (!prysmValidatorContainer)
    throw Error(`Prysm validator container not found in package ${dnpName}`);

  return prysmValidatorContainer;
}

/**
 * Returns the volume of the Prysm validator container
 * @param container
 */
export async function getPrysmValidatorVolumes(
  container: PackageContainer
): Promise<Dockerode.Volume> {
  const prysmValidatorVolume = container.volumes.find(volume => {
    volume.container;
  });

  if (!prysmValidatorVolume)
    throw Error(`Prysm validator container has no volume`);

  const volume = docker.getVolume(prysmValidatorVolume.host);
  if (!volume) throw Error(`Prysm validator volume not found`);

  return volume;
}
