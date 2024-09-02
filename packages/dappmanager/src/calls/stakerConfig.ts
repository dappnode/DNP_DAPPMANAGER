import { StakerConfigGet, StakerConfigSet, Network } from "@dappnode/types";
import { execution, consensus, mevBoost, signer } from "../index.js";

/**
 * Sets the staker configuration: execution and consensus clients, remote signer,
 * mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigSet({ stakerConfig }: { stakerConfig: StakerConfigSet }): Promise<void> {
  const { network, executionDnpName, consensusDnpName, mevBoostDnpName, relays, web3signerDnpName } = stakerConfig;
  await Promise.all([
    await execution.setNewExecution(network, executionDnpName),
    await consensus.setNewConsensus(network, consensusDnpName),
    await mevBoost.setNewMevBoost(network, mevBoostDnpName, relays)
  ]);

  // WEB3SIGNER
  // The web3signer deppends on the global envs EXECUTION_CLIENT and CONSENSUS_CLIENT
  // so it is convenient to set it at the end once the db is updated
  await signer.setNewSigner(network, web3signerDnpName);
}

/**
 * Returns the current staker configuration: execution and consensus clients,
 * remote signer, mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigGet(network: Network): Promise<StakerConfigGet> {
  return await Promise.all([
    await execution.getAllExecutions(network),
    await consensus.getAllConsensus(network),
    await mevBoost.getAllMevBoost(network),
    await signer.getAllSigners(network)
  ]).then(([executionClients, consensusClients, mevBoost, web3signer]) => {
    return {
      executionClients,
      consensusClients,
      mevBoost: mevBoost[0],
      web3Signer: web3signer[0]
    };
  });
}
