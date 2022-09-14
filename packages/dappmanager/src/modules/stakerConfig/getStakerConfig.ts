import { fetchDnpRequest, packageGet, packagesGet } from "../../calls";
import { getIsInstalled } from "../../calls/fetchDnpRequest";
import {
  InstalledPackageData,
  Network,
  RequestedDnp,
  StakerConfigGet
} from "../../types";
import { fileToGatewayUrl } from "../../utils/distributedFile";
import { listPackageNoThrow, listPackages } from "../docker/list";
import { ReleaseFetcher } from "../release";
import {
  getBeaconServiceName,
  getNetworkStakerPkgs,
  getValidatorServiceName
} from "./utils";

/**
 * Fetches the current staker configuration:
 * - execution clients: isInstalled and isSelected
 * - consensus clients: isInstalled and isSelected
 * - web3signer: isInstalled and isSelected
 * - mevBoost: isInstalled and isSelected
 * - graffiti
 * - fee recipient address
 * - checkpoint sync url
 * @param network
 */
export async function getStakerConfig(
  network: Network
): Promise<StakerConfigGet> {
  try {
    const releaseFetcher = new ReleaseFetcher();

    const {
      execClients,
      currentExecClient,
      consClients,
      currentConsClient,
      web3signer,
      mevBoostDnpName,
      isMevBoostSelected
    } = getNetworkStakerPkgs(network);

    const dnpList = await listPackages();

    const executionClients = await Promise.all(
      execClients.map(async execClient => {
        const repository = await releaseFetcher.getRelease(execClient.dnpName);
        return {
          dnpName: repository.dnpName,
          avatarUrl: fileToGatewayUrl(repository.avatarFile),
          isInstalled: getIsInstalled(repository, dnpList),
          isRunning: getIsRunning(repository, dnpList),
          metadata: repository.metadata,
          isSelected: repository.dnpName === currentExecClient
        };
      })
    );

    const consensusClients = await Promise.all(
      consClients.map(async consClient => {
        const repository = await releaseFetcher.getRelease(consClient.dnpName);
        const isInstalled = getIsInstalled(repository, dnpList);
        let graffiti, feeRecipient, checkpointSync;
        if (isInstalled) {
          const pkgEnv = (await packageGet({ dnpName: repository.dnpName }))
            .userSettings?.environment;
          if (pkgEnv) {
            const validatorService = getValidatorServiceName(
              repository.dnpName
            );
            const beaconService = getBeaconServiceName(repository.dnpName);
            graffiti = pkgEnv[validatorService]["GRAFFITI"];
            feeRecipient = pkgEnv[validatorService]["FEE_RECIPIENT_ADDRESS"];
            checkpointSync = pkgEnv[beaconService]["CHECKPOINT_SYNC_URL"];
          }
        }
        return {
          dnpName: repository.dnpName,
          avatarUrl: fileToGatewayUrl(repository.avatarFile),
          isInstalled: getIsInstalled(repository, dnpList),
          isRunning: getIsRunning(repository, dnpList),
          metadata: repository.metadata,
          isSelected: repository.dnpName === currentConsClient,
          graffiti,
          feeRecipient,
          checkpointSync
        };
      })
    );

    const web3signerRepository = await releaseFetcher.getRelease(
      web3signer.dnpName
    );
    const signerIsRunning = getIsRunning(web3signerRepository, dnpList);
    const signer = {
      dnpName: web3signerRepository.dnpName,
      avatarUrl: fileToGatewayUrl(web3signerRepository.avatarFile),
      isInstalled: getIsInstalled(web3signerRepository, dnpList),
      isRunning: signerIsRunning,
      metadata: web3signerRepository.metadata,
      isSelected: signerIsRunning
    };

    const mevBoostRepository = await releaseFetcher.getRelease(mevBoostDnpName);
    const mevBoost = {
      dnpName: mevBoostRepository.dnpName,
      avatarUrl: fileToGatewayUrl(mevBoostRepository.avatarFile),
      isInstalled: getIsInstalled(mevBoostRepository, dnpList),
      isRunning: getIsRunning(mevBoostRepository, dnpList),
      metadata: mevBoostRepository.metadata,
      isSelected: isMevBoostSelected
    };

    return {
      executionClients,
      consensusClients,
      web3Signer: signer,
      mevBoost
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}

// Utils

function getIsRunning(
  { dnpName }: { dnpName: string },
  dnpList: InstalledPackageData[]
): boolean {
  return (
    dnpList
      .find(dnp => dnp.dnpName === dnpName)
      ?.containers.every(c => c.running) ?? false
  );
}
