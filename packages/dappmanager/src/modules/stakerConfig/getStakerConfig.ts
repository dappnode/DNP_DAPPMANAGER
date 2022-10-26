import { packageGet } from "../../calls";
import { getIsInstalled, getIsUpdated } from "../../calls/fetchDnpRequest";
import {
  InstalledPackageData,
  Network,
  StakerConfigGet,
  StakerItem
} from "../../types";
import { fileToGatewayUrl } from "../../utils/distributedFile";
import { listPackages } from "../docker/list";
import { ReleaseFetcher } from "../release";
import {
  getBeaconServiceName,
  getStakerParamsByNetwork,
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
    } = getStakerParamsByNetwork(network);

    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        execClients.map(async execClient => {
          try {
            if (!(await releaseFetcher.repoExists(execClient.dnpName)))
              throw Error(`Repository ${execClient.dnpName} does not exist`);
            const repository = await releaseFetcher.getRelease(
              execClient.dnpName
            );
            // Print the object respository
            return {
              status: "ok",
              dnpName: repository.dnpName,
              avatarUrl: fileToGatewayUrl(repository.avatarFile),
              isInstalled: getIsInstalled(repository, dnpList),
              isUpdated: getIsUpdated(repository, dnpList),
              isRunning: getIsRunning(repository, dnpList),
              metadata: repository.metadata,
              isSelected: repository.dnpName === currentExecClient
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: execClient.dnpName,
              error
            };
          }
        })
      ),
      consensusClients: await Promise.all(
        consClients.map(async consClient => {
          try {
            if (!(await releaseFetcher.repoExists(consClient.dnpName)))
              throw Error(`Repository ${consClient.dnpName} does not exist`);
            const repository = await releaseFetcher.getRelease(
              consClient.dnpName
            );
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
                feeRecipient =
                  pkgEnv[validatorService]["FEE_RECIPIENT_ADDRESS"];
                checkpointSync = pkgEnv[beaconService]["CHECKPOINT_SYNC_URL"];
              }
            }
            return {
              status: "ok",
              dnpName: repository.dnpName,
              avatarUrl: fileToGatewayUrl(repository.avatarFile),
              isInstalled: getIsInstalled(repository, dnpList),
              isUpdated: getIsUpdated(repository, dnpList),
              isRunning: getIsRunning(repository, dnpList),
              metadata: repository.metadata,
              isSelected: repository.dnpName === currentConsClient,
              graffiti,
              feeRecipient,
              checkpointSync
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: consClient.dnpName,
              error
            };
          }
        })
      ),
      web3Signer: await new Promise<StakerItem>(async resolve => {
        try {
          if (!(await releaseFetcher.repoExists(web3signer.dnpName)))
            throw Error(`Repository ${web3signer.dnpName} does not exist`);
          const repository = await releaseFetcher.getRelease(
            web3signer.dnpName
          );
          const signerIsRunning = getIsRunning(repository, dnpList);
          resolve({
            status: "ok",
            dnpName: repository.dnpName,
            avatarUrl: fileToGatewayUrl(repository.avatarFile),
            isInstalled: getIsInstalled(repository, dnpList),
            isUpdated: getIsUpdated(repository, dnpList),
            isRunning: signerIsRunning,
            metadata: repository.metadata,
            isSelected: signerIsRunning
          });
        } catch (error) {
          resolve({
            status: "error",
            dnpName: web3signer.dnpName,
            error
          });
        }
      }),
      mevBoost: await new Promise<StakerItem>(async resolve => {
        try {
          if (!(await releaseFetcher.repoExists(mevBoostDnpName)))
            throw Error(`Repository ${mevBoostDnpName} does not exist`);
          const repository = await releaseFetcher.getRelease(mevBoostDnpName);
          resolve({
            status: "ok",
            dnpName: repository.dnpName,
            avatarUrl: fileToGatewayUrl(repository.avatarFile),
            isInstalled: getIsInstalled(repository, dnpList),
            isUpdated: getIsUpdated(repository, dnpList),
            isRunning: getIsRunning(repository, dnpList),
            metadata: repository.metadata,
            isSelected: isMevBoostSelected
          });
        } catch (error) {
          resolve({
            status: "error",
            dnpName: mevBoostDnpName,
            error
          });
        }
      })
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
