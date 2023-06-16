import { Network } from "@dappnode/types";
import { getStakerConfig } from "../modules/stakerConfig/index.js";
import { setStakerConfig } from "../modules/stakerConfig/index.js";
import { StakerConfigGet, StakerConfigSet } from "@dappnode/common";

/**
 * Sets the staker configuration: execution and consensus clients, remote signer,
 * mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigSet<T extends Network>({
  stakerConfig
}: {
  stakerConfig: StakerConfigSet<T>;
}): Promise<void> {
  await setStakerConfig<T>({ ...stakerConfig });
}

/**
 * Returns the current staker configuration: execution and consensus clients,
 * remote signer, mev boost, graffiti, fee recipient address and checkpoint sync url
 */
export async function stakerConfigGet<T extends Network>(
  network: Network
): Promise<StakerConfigGet<T>> {
  return await getStakerConfig<T>(network);
}
