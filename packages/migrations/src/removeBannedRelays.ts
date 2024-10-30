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
    const mevBoostDnpName = MevBoost.CompatibleMevBoost[network]?.dnpName;
    if (mevBoostDnpName) {
      const relays = await mevBoost.getMevBoostCurrentRelays(mevBoostDnpName);
      const newRelays = relays.filter((relay) => !bannedRelays.includes(relay));
      if (newRelays.length !== relays.length) {
        await mevBoost.setNewMevBoost(network, mevBoostDnpName, newRelays);
      }
    }
  }
}
