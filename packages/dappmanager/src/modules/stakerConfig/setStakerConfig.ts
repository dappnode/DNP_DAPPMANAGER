import {
  packagesGet,
  packageInstall,
  packageSetEnvironment,
  packageStartStop
} from "../../calls";
import { StakerConfigSet, UserSettingsAllDnps } from "../../types";
import { logs } from "../../logs";
import {
  getValidatorServiceName,
  setStakerConfigOnDb,
  getNetworkStakerPkgs
} from "./utils";

/**
 *  Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - graffiti and fee recipient address
 * @param stakerConfig
 * TODO: add option to remove previous or not
 */
export async function setStakerConfig({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet;
}): Promise<void> {
  const {
    execClientsAvail,
    currentExecClient,
    consClientsAvail,
    currentConsClient,
    web3signerAvail,
    mevBoostAvail
  } = getNetworkStakerPkgs(stakerConfig.network);

  try {
    // Ensure Execution clients DNP's names are valid
    if (
      stakerConfig.executionClient &&
      !execClientsAvail.includes(stakerConfig.executionClient)
    )
      throw Error(
        `Invalid execution client ${stakerConfig.executionClient} for network ${stakerConfig.network}`
      );
    // Ensure Consensus clients DNP's names are valid
    if (
      stakerConfig.consensusClient &&
      !consClientsAvail.includes(stakerConfig.consensusClient)
    )
      throw Error(
        `Invalid consensus client ${stakerConfig.consensusClient} for network ${stakerConfig.network}`
      );

    const pkgs = await packagesGet();

    // EXECUTION CLIENT
    if (stakerConfig.executionClient) {
      // Ensure the EC is installed
      if (currentExecClient === stakerConfig.executionClient) {
        logs.info(
          "Execution client is already set to " + stakerConfig.executionClient
        );
        if (!pkgs.find(p => p.dnpName === stakerConfig.executionClient)) {
          logs.info("Installing " + stakerConfig.executionClient);
          await packageInstall({ name: stakerConfig.executionClient });
        }
      } // If the EC is not installed, install it
      else {
        // Remove the previous
        /* logs.info("Removing " + currentExecClient);
          await packageRemove({ dnpName: currentExecClient }); */
        // Install the new EC
        logs.info("Installing " + stakerConfig.executionClient);
        await packageInstall({ name: stakerConfig.executionClient });
      }
    }

    // CONSENSUS CLIENT (+ Fee recipient address + Graffiti + Checkpointsync)
    if (stakerConfig.consensusClient) {
      // User settings object: GRAFFITI, FEE_RECIPIENT_ADDRESS, CHECKPOINTSYNC
      const userSettings: UserSettingsAllDnps = {
        [stakerConfig.consensusClient]: {
          environment: {
            [getValidatorServiceName(stakerConfig.consensusClient)]: {
              // Graffiti is a mandatory value
              ["GRAFFITI"]: stakerConfig.graffiti || "Validating_from_DAppNode",
              // Fee recipient is a mandatory value
              ["FEE_RECIPIENT_ADDRESS"]:
                stakerConfig.feeRecipient ||
                "0x0000000000000000000000000000000000000000",
              // Checkpoint sync is an optional value
              ["CHECKPOINT_SYNC_URL"]: stakerConfig.checkpointSync || ""
            }
          }
        }
      };

      // Ensure the CC selected is installed
      if (currentConsClient === stakerConfig.consensusClient) {
        logs.info(
          "Consensus client is already set to " + stakerConfig.consensusClient
        );
        if (!pkgs.find(p => p.dnpName === stakerConfig.consensusClient)) {
          logs.info("Installing " + stakerConfig.consensusClient);
          await packageInstall({
            name: stakerConfig.consensusClient,
            userSettings
          });
        } // If the CC is not installed, install it
        else if (
          stakerConfig.graffiti ||
          stakerConfig.feeRecipient ||
          stakerConfig.checkpointSync
        ) {
          const serviceEnv =
            userSettings[stakerConfig.consensusClient].environment;

          if (serviceEnv) {
            logs.info(
              "Updating environment for " + stakerConfig.consensusClient
            );
            await packageSetEnvironment({
              dnpName: stakerConfig.consensusClient,
              environmentByService: serviceEnv
            });
          }
        }
      } // Install the new CC
      else {
        // Remove the previous
        /*       logs.info("Removing " + currentConsClient);
        await packageRemove({ dnpName: currentConsClient }); */
        // Install the new CC
        logs.info("Installing " + stakerConfig.consensusClient);
        await packageInstall({
          name: stakerConfig.consensusClient,
          userSettings
        });
      }
    }

    // WEB3SIGNER
    const web3signerPkg = pkgs.find(p => p.dnpName === web3signerAvail);
    // Web3signer installed and enable => make sure its running
    if (web3signerPkg && stakerConfig.enableWeb3signer) {
      logs.info("Web3Signer is already installed");
      for (const container of web3signerPkg.containers) {
        if (!container.running) {
          logs.info("Starting Web3Signer container");
          await packageStartStop({
            dnpName: web3signerPkg.dnpName,
            serviceNames: [container.serviceName]
          }).catch(e => logs.error(e.message));
        }
      }
    } // Web3signer installed and disabled => make sure its stopped
    else if (web3signerPkg && !stakerConfig.enableWeb3signer) {
      for (const container of web3signerPkg.containers) {
        if (container.running) {
          logs.info("Stopping Web3Signer container");
          await packageStartStop({
            dnpName: web3signerPkg.dnpName,
            serviceNames: [container.serviceName]
          }).catch(e => logs.error(e.message));
        }
      }
    } // Web3signer not installed and enable => install it
    else if (!web3signerPkg && stakerConfig.enableWeb3signer) {
      logs.info("Installing Web3Signer");
      await packageInstall({ name: web3signerAvail });
    }

    // MEV BOOST
    if (stakerConfig.enableMevBoost) {
      const mevBoostPkg = pkgs.find(p => p.dnpName === mevBoostAvail);
      if (mevBoostPkg) {
        logs.info("MevBoost is already installed");
      } else if (stakerConfig.enableMevBoost) {
        // Install mevboost if selected and not installed
        logs.info("Installing MevBoost");
        await packageInstall({ name: mevBoostAvail });
      }
    }

    // Persist the staker config on db
    setStakerConfigOnDb(stakerConfig.network, stakerConfig);
  } catch (e) {
    throw Error(`Error setting staker config: ${e}`);
  }
}
