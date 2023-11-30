import { getStakerConfig, setStakerConfig } from "@dappnode/stakers";
import { StakerConfigGet, StakerConfigSet, Network } from "@dappnode/common";
import { dappnodeInstaller } from "../index.js";

/**
 * Sets the staker configuration: execution and consensus clients, remote signer,
 * mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigSet<T extends Network>({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet<T>;
}): Promise<void> {
  await setStakerConfig<T>(dappnodeInstaller, { ...stakerConfig });
}

/**
 * Returns the current staker configuration: execution and consensus clients,
 * remote signer, mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigGet<T extends Network>(
  network: Network
): Promise<StakerConfigGet<T>> {
  return await getStakerConfig<T>(dappnodeInstaller, network);
}
