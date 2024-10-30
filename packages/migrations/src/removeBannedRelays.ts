import { logs } from "@dappnode/logger";
import { MevBoost } from "@dappnode/stakers";
import { Network } from "@dappnode/types";

/**
 * Checks for banned relays in the mevboost package enviroment variable RELAYS
 * and removes them from the list if they are present. Then restarts the mevboost package.
 */
export async function removeBannedRelays(mevBoost: MevBoost): Promise<void> {
  const bannedRelays = [
    "https://0xb3ee7afcf27f1f1259ac1787876318c6584ee353097a50ed84f51a1f21a323b3736f271a895c7ce918c038e4265918be@relay.edennetwork.io"
  ];
  for (const network of Object.values(Network)) {
    logs.info(`Removing banned relays from mevboost package for network ${network}`);
    const mevBoostDnpName = MevBoost.CompatibleMevBoost[network]?.dnpName;
    if (mevBoostDnpName) {
      logs.info(`Checking banned relays for mevboost package ${mevBoostDnpName}`);
      const relays = await mevBoost.getMevBoostCurrentRelays(mevBoostDnpName);
      logs.info(`Current relays: ${relays}`);
      const newRelays = relays.filter((relay) => !bannedRelays.includes(relay));
      if (newRelays.length !== relays.length) {
        logs.info(`Removing banned relays: ${bannedRelays.filter((relay) => !newRelays.includes(relay))}`);
        await mevBoost.setNewMevBoost(network, mevBoostDnpName, newRelays);
      }
    }
  }
}
