import { getStakerConfig } from "../modules/stakerConfig/getStakerConfig";
import { setStakerConfig } from "../modules/stakerConfig/setStakerConfig";
import { Network, StakerConfigGet, StakerConfigSet } from "../types";

/**
 * Sets the staker configuration: execution and consensus clients, remote signer,
 * mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigSet<T extends Network>({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet<T>;
}): Promise<void> {
  await setStakerConfig({ stakerConfig });
}

/**
 * Returns the current staker configuration: execution and consensus clients,
 * remote signer, mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigGet(
  network: Network
): Promise<StakerConfigGet> {
  return await getStakerConfig(network);
}
