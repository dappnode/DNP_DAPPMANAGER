import { packageGet } from "../../../calls/index.js";
import {
  getIsInstalled,
  getIsUpdated
} from "../../../calls/fetchDnpRequest.js";
import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  Signer,
  StakerConfigGet,
  StakerItem
} from "@dappnode/common";
import { fileToGatewayUrl } from "../../../utils/distributedFile.js";
import { listPackages } from "../../docker/list/index.js";
import { ReleaseFetcher } from "../../release/index.js";
import { getBeaconServiceName, getIsRunning, getPkgData } from "../utils.js";
import { Network } from "@dappnode/types";
import { getStakerDnpNamesByNetwork } from "../set/getStakerDnpNamesByNetwork.js";
import { getStakerConfigByNetwork } from "../getStakerConfigByNetwork.js";

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

    const { executionClients, consensusClients, signer, mevBoost } =
      getStakerDnpNamesByNetwork(network);

    const {
      executionClient: currentExecClient,
      consensusClient: currentConsClient,
      feeRecipient,
      isMevBoostSelected
    } = getStakerConfigByNetwork(network);

    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        executionClients.map(async execClient => {
          try {
            if (!(await releaseFetcher.repoExists(execClient)))
              throw Error(`Repository ${execClient} does not exist`);

            const pkgData = await getPkgData(releaseFetcher, execClient);

            return {
              status: "ok",
              dnpName: execClient as ExecutionClient<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: execClient === currentExecClient
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: execClient as ExecutionClient<T>,
              error
            };
          }
        })
      ),
      consensusClients: await Promise.all(
        consensusClients.map(async consClient => {
          try {
            if (!(await releaseFetcher.repoExists(consClient)))
              throw Error(`Repository ${consClient} does not exist`);
            const pkgData = await getPkgData(releaseFetcher, consClient);
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
              useCheckpointSync
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: consClient as ConsensusClient<T>,
              error
            };
          }
        })
      ),
      web3Signer: await new Promise<StakerItem<T, "signer">>(resolve => {
        (async () => {
          try {
            if (!(await releaseFetcher.repoExists(signer[0])))
              throw Error(`Repository ${signer[0]} does not exist`);
            const pkgData = await getPkgData(releaseFetcher, signer[0]);
            const signerIsRunning = getIsRunning(pkgData, dnpList);
            resolve({
              status: "ok",
              dnpName: signer[0] as Signer<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: signerIsRunning,
              data: pkgData,
              isSelected: signerIsRunning
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: signer[0] as Signer<T>,
              error
            });
          }
        })();
      }),
      mevBoost: await new Promise<StakerItem<T, "mev-boost">>(resolve => {
        (async () => {
          try {
            if (!(await releaseFetcher.repoExists(mevBoost[0])))
              throw Error(`Repository ${mevBoost[0]} does not exist`);
            const pkgData = await getPkgData(releaseFetcher, mevBoost[0]);
            const isInstalled = getIsInstalled(pkgData, dnpList);
            const relays: string[] = [];
            if (isInstalled) {
              const pkgEnv = (await packageGet({ dnpName: pkgData.dnpName }))
                .userSettings?.environment;
              if (pkgEnv) {
                pkgEnv["mev-boost"]["RELAYS"]
                  .split(",")
                  .forEach(relay => relays.push(relay));
              }
            }
            resolve({
              status: "ok",
              dnpName: mevBoost[0] as MevBoost<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled,
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: Boolean(isMevBoostSelected),
              relays
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: mevBoost[0] as MevBoost<T>,
              error
            });
          }
        })();
      }),
      feeRecipient
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}
