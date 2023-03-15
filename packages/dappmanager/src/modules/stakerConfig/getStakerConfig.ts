import { packageGet } from "../../calls/index.js";
import { getIsInstalled, getIsUpdated } from "../../calls/fetchDnpRequest.js";
import {
  ConsensusClient,
  ExecutionClient,
  MevBoost,
  Network,
  Signer,
  StakerConfigGet,
  StakerItem
} from "@dappnode/common";
import { fileToGatewayUrl } from "../../utils/distributedFile.js";
import { listPackages } from "../docker/list/index.js";
import { ReleaseFetcher } from "../release/index.js";
import {
  getBeaconServiceName,
  getIsRunning,
  getPkgData,
  getValidatorServiceName
} from "./utils.js";
import { stakerParamsByNetwork } from "./stakerParamsByNetwork.js";

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
      execClients,
      currentExecClient,
      consClients,
      currentConsClient,
      web3signer,
      mevBoost,
      isMevBoostSelected,
      feeRecipient
    } = stakerParamsByNetwork(network);

    const dnpList = await listPackages();

    return {
      executionClients: await Promise.all(
        execClients.map(async execClient => {
          try {
            if (!(await releaseFetcher.repoExists(execClient.dnpName)))
              throw Error(`Repository ${execClient.dnpName} does not exist`);

            const pkgData = await getPkgData(
              releaseFetcher,
              execClient.dnpName
            );

            return {
              status: "ok",
              dnpName: execClient.dnpName as ExecutionClient<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: execClient.dnpName === currentExecClient
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: execClient.dnpName as ExecutionClient<T>,
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
            const pkgData = await getPkgData(
              releaseFetcher,
              consClient.dnpName
            );
            const isInstalled = getIsInstalled(pkgData, dnpList);
            let graffiti, checkpointSync;
            if (isInstalled) {
              const pkgEnv = (await packageGet({ dnpName: pkgData.dnpName }))
                .userSettings?.environment;
              if (pkgEnv) {
                graffiti =
                  pkgEnv[getValidatorServiceName(pkgData.dnpName)]["GRAFFITI"];
                checkpointSync =
                  pkgEnv[getBeaconServiceName(pkgData.dnpName)][
                    "CHECKPOINT_SYNC_URL"
                  ];
              }
            }
            return {
              status: "ok",
              dnpName: consClient.dnpName as ConsensusClient<T>,
              avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
              isInstalled: getIsInstalled(pkgData, dnpList),
              isUpdated: getIsUpdated(pkgData, dnpList),
              isRunning: getIsRunning(pkgData, dnpList),
              data: pkgData,
              isSelected: consClient.dnpName === currentConsClient,
              graffiti,
              checkpointSync
            };
          } catch (error) {
            return {
              status: "error",
              dnpName: consClient.dnpName as ConsensusClient<T>,
              error
            };
          }
        })
      ),
      web3Signer: await new Promise<StakerItem<T, "signer">>(async resolve => {
        try {
          if (!(await releaseFetcher.repoExists(web3signer.dnpName)))
            throw Error(`Repository ${web3signer.dnpName} does not exist`);
          const pkgData = await getPkgData(releaseFetcher, web3signer.dnpName);
          const signerIsRunning = getIsRunning(pkgData, dnpList);
          resolve({
            status: "ok",
            dnpName: web3signer.dnpName as Signer<T>,
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
            dnpName: web3signer.dnpName as Signer<T>,
            error
          });
        }
      }),
      mevBoost: await new Promise<StakerItem<T, "mev-boost">>(async resolve => {
        try {
          if (!(await releaseFetcher.repoExists(mevBoost)))
            throw Error(`Repository ${mevBoost} does not exist`);
          const pkgData = await getPkgData(releaseFetcher, mevBoost);
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
            dnpName: mevBoost as MevBoost<T>,
            avatarUrl: fileToGatewayUrl(pkgData.avatarFile),
            isInstalled,
            isUpdated: getIsUpdated(pkgData, dnpList),
            isRunning: getIsRunning(pkgData, dnpList),
            data: pkgData,
            isSelected: isMevBoostSelected,
            relays
          });
        } catch (error) {
          resolve({
            status: "error",
            dnpName: mevBoost as MevBoost<T>,
            error
          });
        }
      }),
      feeRecipient
    };
  } catch (e) {
    throw Error(`Error getting staker config: ${e}`);
  }
}
