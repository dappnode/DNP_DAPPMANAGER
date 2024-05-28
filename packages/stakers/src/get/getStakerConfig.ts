import {
  getIsInstalled,
  getIsRunning,
  getIsUpdated,
  fileToGatewayUrl,
  getBeaconServiceName,
} from "@dappnode/utils";
import { StakerConfigGet, StakerItem, Network } from "@dappnode/types";
import { listPackages } from "@dappnode/dockerapi";
import {
  packageGetData,
  packageGet,
  DappnodeInstaller,
} from "@dappnode/installer";
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
export async function getStakerConfig(
  dappnodeInstaller: DappnodeInstaller,
  network: Network
): Promise<StakerConfigGet> {
  try {
    const { executionClients, consensusClients, signer, mevBoost } =
      getStakerDnpNamesByNetwork(network);

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
            // make sure repo exists
            await dappnodeInstaller.getRepoContract(execClient);

            const pkgData = await packageGetData(dappnodeInstaller, execClient);

            return {
              status: "ok",
              dnpName: execClient,
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
              dnpName: execClient,
              error,
            };
          }
        })
      ),
      consensusClients: await Promise.all(
        consensusClients.map(async (consClient) => {
          try {
            // make sure repo exists
            await dappnodeInstaller.getRepoContract(consClient);
            const pkgData = await packageGetData(dappnodeInstaller, consClient);
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
              dnpName: consClient,
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
              dnpName: consClient,
              error,
            };
          }
        })
      ),
      web3Signer: await new Promise<StakerItem>((resolve) => {
        (async () => {
          try {
            // make sure repo exists
            await dappnodeInstaller.getRepoContract(signer);
            const pkgData = await packageGetData(dappnodeInstaller, signer);
            const signerIsRunning = getIsRunning(pkgData, dnpList);
            resolve({
              status: "ok",
              dnpName: signer,
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
              dnpName: signer,
              error,
            });
          }
        })();
      }),
      mevBoost: await new Promise<StakerItem>((resolve) => {
        (async () => {
          try {
            // make sure repo exists
            await dappnodeInstaller.getRepoContract(mevBoost);
            const pkgData = await packageGetData(dappnodeInstaller, mevBoost);
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
              dnpName: mevBoost,
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
              dnpName: mevBoost,
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
