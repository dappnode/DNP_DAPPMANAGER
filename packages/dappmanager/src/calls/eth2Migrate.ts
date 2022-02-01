import { eth2Migrate as migrateEth2 } from "../modules/eth2migration/index";
import { Eth2Client, Eth2Network } from "../types";

export async function eth2Migrate({
  client,
  network
}: {
  client: Eth2Client;
  network: Eth2Network;
}): Promise<void> {
  await migrateEth2({ client, network });
}
