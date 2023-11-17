import {
  getIsInstalled,
  getIsRunning,
  getIsUpdated,
  fileToGatewayUrl,
  getBeaconServiceName,
} from "@dappnode/utils";
import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  Signer,
  StakerConfigGet,
  StakerItem,
} from "@dappnode/common";
import { listPackages } from "@dappnode/dockerapi";
import {
  ReleaseFetcher,
  packageGetData,
  packageGet,
} from "@dappnode/installer";
import { Network } from "@dappnode/types";
import { getStakerDnpNamesByNetwork } from "./getStakerDnpNamesByNetwork.js";
import { getStakerConfigByNetwork } from "../index.js";

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
export async function getStakerConfig<T extends Network>(
  network: Network
): Promise<StakerConfigGet<T>> {
  try {
    const releaseFetcher = new ReleaseFetcher();

    const {
      executionClients,
      consensusClients,
      signer,
      mevBoost,
    } = getStakerDnpNamesByNetwork(network);

    const {
      executionClient: currentExecClient,
      consensusClient: currentConsClient,
      isMevBoostSelected,
    } = getStakerConfigByNetwork(network);

    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        executionClients.map(async (execClient) => {
          try {
            if (!(await releaseFetcher.repoExists(execClient)))
              throw Error(`Repository ${execClient} does not exist`);

            const pkgData = await packageGetData(releaseFetcher, execClient);

            return {
              status: "ok",
              dnpName: execClient as ExecutionClient<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: execClient === currentExecClient,
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: execClient as ExecutionClient<T>,
              error,
            };
          }
        })
      ),
      consensusClients: await Promise.all(
        consensusClients.map(async (consClient) => {
          try {
            if (!(await releaseFetcher.repoExists(consClient)))
              throw Error(`Repository ${consClient} does not exist`);
            const pkgData = await packageGetData(releaseFetcher, consClient);
            const isInstalled = getIsInstalled(pkgData, dnpList);
            let useCheckpointSync = false;
            if (isInstalled) {
              const pkgEnv = (await packageGet({ dnpName: pkgData.dnpName }))
                .userSettings?.environment;
              if (
                pkgEnv &&
                pkgEnv[getBeaconServiceName(pkgData.dnpName)][
                  "CHECKPOINT_SYNC_URL"
                ]
              )
                useCheckpointSync = true;
            }
            return {
              status: "ok",
              dnpName: consClient as ConsensusClient<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: consClient === currentConsClient,
              useCheckpointSync,
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: consClient as ConsensusClient<T>,
              error,
            };
          }
        })
      ),
      web3Signer: await new Promise<StakerItem<T, "signer">>((resolve) => {
        (async () => {
          try {
            if (!(await releaseFetcher.repoExists(signer)))
              throw Error(`Repository ${signer} does not exist`);
            const pkgData = await packageGetData(releaseFetcher, signer);
            const signerIsRunning = getIsRunning(pkgData, dnpList);
            resolve({
              status: "ok",
              dnpName: signer as Signer<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: signerIsRunning,
              data: pkgData,
              isSelected: signerIsRunning,
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: signer as Signer<T>,
              error,
            });
          }
        })();
      }),
      mevBoost: await new Promise<StakerItem<T, "mev-boost">>((resolve) => {
        (async () => {
          try {
            if (!(await releaseFetcher.repoExists(mevBoost)))
              throw Error(`Repository ${mevBoost} does not exist`);
            const pkgData = await packageGetData(releaseFetcher, mevBoost);
            const isInstalled = getIsInstalled(pkgData, dnpList);
            const relays: string[] = [];
            if (isInstalled) {
              const pkgEnv = (await packageGet({ dnpName: pkgData.dnpName }))
                .userSettings?.environment;
              if (pkgEnv) {
                pkgEnv["mev-boost"]["RELAYS"]
                  .split(",")
                  .forEach((relay) => relays.push(relay));
              }
            }
            resolve({
              status: "ok",
              dnpName: mevBoost as MevBoost<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled,
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: Boolean(isMevBoostSelected),
              relays,
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: mevBoost as MevBoost<T>,
              error,
            });
          }
        })();
      }),
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}
