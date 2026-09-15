import { ComposeFileEditor } from "@dappnode/dockercompose";
import { dockerComposeUpPackage, getContainersStatus, listPackageNoThrow } from "@dappnode/dockerapi";
import { logs } from "@dappnode/logger";
import { MevBoostMainnet } from "@dappnode/types";

const MEV_BOOST_SERVICE_NAME = "mev-boost";
export const BLOXROUTE_MAX_PROFIT_RELAY =
  "https://0x8b5d2e73e2a3a55c6c87b8b6eb92e0149a125c852751db1422fa951e42a09b82c142c3ea98d0d9930b056a3bc9896b8f@bloxroute.max-profit.blxrbdn.com";

/**
 * Remove the retired bloXroute Max Profit relay from the installed mainnet
 * MEV-Boost package while preserving all other configured relays.
 */
export async function removeBloxrouteMaxProfitRelay(): Promise<void> {
  const dnpName = MevBoostMainnet.Mevboost;
  const installedPackage = await listPackageNoThrow({ dnpName });
  if (!installedPackage) return;

  const compose = new ComposeFileEditor(dnpName, false);
  const service = compose.services()[MEV_BOOST_SERVICE_NAME];
  if (!service) {
    logs.warn(`Cannot migrate bloXroute Max Profit relay: service ${MEV_BOOST_SERVICE_NAME} not found in ${dnpName}`);
    return;
  }

  const currentRelays = service.getEnvs().RELAYS;
  if (currentRelays === undefined) return;

  const migratedRelays = removeRelayFromList(currentRelays, BLOXROUTE_MAX_PROFIT_RELAY);
  if (migratedRelays === currentRelays) return;

  service.mergeEnvs({ RELAYS: migratedRelays });
  compose.write();
  logs.info(`Removed bloXroute Max Profit relay from ${dnpName}`);

  const containersStatus = await getContainersStatus({ dnpName, dnp: installedPackage });
  await dockerComposeUpPackage({
    composeArgs: { dnpName },
    upAll: false,
    containersStatus,
    dockerComposeUpOptions: { forceRecreate: true }
  });
}

export function removeRelayFromList(relays: string, relayToRemove: string): string {
  const relayList = relays.split(",").map((relay) => relay.trim());
  if (!relayList.includes(relayToRemove)) return relays;
  return relayList.filter((relay) => relay && relay !== relayToRemove).join(",");
}
