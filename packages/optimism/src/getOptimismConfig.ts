import {
  OptimismConfigGet,
  OptimismItem,
  executionClientsOptimism,
  optimismL2Geth,
  optimismNode,
} from "@dappnode/types";
import * as db from "@dappnode/db";
import { listPackages } from "@dappnode/dockerapi";
import { DappnodeInstaller, packageGetData } from "@dappnode/installer";
import {
  getIsInstalled,
  getIsRunning,
  getIsUpdated,
  fileToGatewayUrl,
} from "@dappnode/utils";
import { getOptimismNodeRpcUrlIfExists } from "./getOptimismNodeRpcUrlIfExists.js";

export async function getOptimismConfig(
  dappnodeInstaller: DappnodeInstaller
): Promise<OptimismConfigGet> {
  try {
    const currentOptimismExecutionClient = db.opExecutionClient.get();
    const enableHistorical = db.opEnableHistoricalRpc.get();
    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        executionClientsOptimism.map(async (execClient) => {
          try {
            // make sure the repo exists
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
              isSelected: execClient === currentOptimismExecutionClient,
              enableHistorical,
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: execClient,
              error,
              enableHistorical,
            };
          }
        })
      ),
      rollup: await new Promise<OptimismItem<"rollup">>((resolve) => {
        (async () => {
          try {
            // make sure the repo exists
            await dappnodeInstaller.getRepoContract(optimismNode);

            const pkgData = await packageGetData(
              dappnodeInstaller,
              optimismNode
            );
            const mainnetRpcUrl = getOptimismNodeRpcUrlIfExists();
            const isRunning = getIsRunning(pkgData, dnpList);
            resolve({
              status: "ok",
              dnpName: optimismNode,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning,
              data: pkgData,
              isSelected: isRunning,
              mainnetRpcUrl,
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: optimismNode,
              error,
              mainnetRpcUrl: "",
            });
          }
        })();
      }),

      archive: await new Promise<OptimismItem<"archive">>((resolve) => {
        (async () => {
          try {
            // make sure the repo exists
            await dappnodeInstaller.getRepoContract(optimismL2Geth);

            const pkgData = await packageGetData(
              dappnodeInstaller,
              optimismL2Geth
            );
            const isRunning = getIsRunning(pkgData, dnpList);
            resolve({
              status: "ok",
              dnpName: optimismL2Geth,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning,
              data: pkgData,
              isSelected: isRunning && enableHistorical,
            });
          } catch (error) {
            resolve({
              status: "error",
              dnpName: optimismL2Geth,
              error,
            });
          }
        })();
      }),
    };
  } catch (e) {
    throw Error(`Error getting Optimism config: ${e}`);
  }
}
