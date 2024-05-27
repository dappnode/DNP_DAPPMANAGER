import { StakerConfigSet } from "@dappnode/types";
import { DappnodeInstaller } from "@dappnode/installer";
import { ensureStakerPkgsNetworkConfig } from "./ensureStakerPkgsNetworkConfig.js";
import { setStakerConfigOnDb } from "./setStakerConfigOnDb.js";
import { Execution } from "./execution.js";
import { Consensus } from "./consensus.js";
import { MevBoost } from "./mevBoost.js";
import { Signer } from "./signer.js";
import { listPackageNoThrow } from "@dappnode/dockerapi";

/**
 *  Sets a new staker configuration based on user selection:
 * - New execution client
 * - New consensus client
 * - Install web3signer and/or mevboost
 * - Checkpointsync, graffiti and fee recipient address
 * @param stakerConfig
 * TODO: add option to remove previous or not
 */
export async function setStakerConfig(
  dappnodeInstaller: DappnodeInstaller,
  {
    network,
    executionDnpName,
    consensusDnpName,
    useCheckpointSync,
    mevBoostDnpName,
    relays,
    web3signerDnpName,
  }: StakerConfigSet
): Promise<void> {
  // create instances
  const executionPkg = new Execution(
    await listPackageNoThrow({ dnpName: executionDnpName || "" }),
    dappnodeInstaller,
    network
  );
  const consensusPkg = new Consensus(
    await listPackageNoThrow({
      dnpName: consensusDnpName || "",
    }),
    dappnodeInstaller,
    network,
    useCheckpointSync
  );
  const mevBoostPkg = new MevBoost(
    await listPackageNoThrow({
      dnpName: mevBoostDnpName || "",
    }),
    dappnodeInstaller,
    network,
    relays
  );
  const signerPkg = new Signer(
    await listPackageNoThrow({
      dnpName: web3signerDnpName || "",
    }),
    dappnodeInstaller,
    network
  );

  await Promise.all([
    executionPkg.setNewExecution(executionDnpName),
    consensusPkg.setNewConsensus(consensusDnpName, useCheckpointSync),
    mevBoostPkg.setNewMevBoost(mevBoostDnpName, relays),
  ]);

  // Set staker config on db
  await setStakerConfigOnDb({
    network,
    executionDnpName,
    consensusDnpName,
    mevBoostDnpName,
  });

  // ensure staker network config. MUST GO AFTER WRITING ON DB
  await ensureStakerPkgsNetworkConfig(network);

  // WEB3SIGNER
  // The web3signer deppends on the global envs EXECUTION_CLIENT and CONSENSUS_CLIENT
  // so it is convenient to set it at the end once the db is updated
  await signerPkg.setNewSigner(web3signerDnpName);
}
