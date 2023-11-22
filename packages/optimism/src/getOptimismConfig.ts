import {
  OptimismConfigGet,
  OptimismItem,
  executionClientsOptimism,
  optimismL2Geth,
  optimismNode,
} from "@dappnode/common";
import * as db from "@dappnode/db";
import { listPackages } from "@dappnode/dockerapi";
import { ReleaseFetcher, packageGetData } from "@dappnode/installer";
import {
  getIsInstalled,
  getIsRunning,
  getIsUpdated,
  fileToGatewayUrl,
} from "@dappnode/utils";
import { getOptimismNodeRpcUrlIfExists } from "./getOptimismNodeRpcUrlIfExists.js";

export async function getOptimismConfig(): Promise<OptimismConfigGet> {
  try {
    const releaseFetcher = new ReleaseFetcher();

    const currentOptimismExecutionClient = db.opExecutionClient.get();
    const enableHistorical = db.opEnableHistoricalRpc.get();
    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        executionClientsOptimism.map(async (execClient) => {
          try {
            if (!(await releaseFetcher.repoExists(execClient)))
              throw Error(`Repository ${execClient} does not exist`);

            const pkgData = await packageGetData(releaseFetcher, execClient);

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
            if (!(await releaseFetcher.repoExists(optimismNode)))
              throw Error(`Repository ${optimismNode} does not exist`);

            const pkgData = await packageGetData(releaseFetcher, optimismNode);
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
            if (!(await releaseFetcher.repoExists(optimismL2Geth)))
              throw Error(`Repository ${optimismL2Geth} does not exist`);

            const pkgData = await packageGetData(
              releaseFetcher,
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
