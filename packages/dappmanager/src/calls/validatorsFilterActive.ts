import { Network } from "@dappnode/types";
import { keystoresGetByNetwork } from "./keystoresGet.js";

type KeystoresByProtocol = Record<string, string[]>;

const ACTIVE_STATUSES = new Set(["active_ongoing", "active_exiting", "active_slashed"]);

/**
 * Query the beacon API for a batch of pubkeys and return the active ones.
 */
async function fetchActivePubkeysForBatch(network: Network, pubkeys: string[]): Promise<string[]> {
  const base = `http://beacon-chain.${network}.dncore.dappnode:3500`;
  const url = new URL(`/eth/v1/beacon/states/head/validators`, base);
  const params = new URLSearchParams();
  for (const pk of pubkeys) params.append("id", pk);
  url.search = params.toString();

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Beacon API ${network} responded ${res.status} ${res.statusText}`);
  }

  type ValidatorEntry = {
    validator: { pubkey: string };
    status: string;
    index?: string;
  };

  const json: { data: ValidatorEntry[] } = await res.json();

  return (json.data ?? []).filter((v) => ACTIVE_STATUSES.has(v.status)).map((v) => v.validator.pubkey.toLowerCase());
}

/**
 * Extract and normalize pubkeys from the keystores object returned by keystoresGetByNetworks.
 */
function extractPubkeys(keystores: object | null | undefined): string[] {
  if (!keystores || typeof keystores !== "object") return [];
  const byProtocol = keystores as KeystoresByProtocol;
  const all = Object.values(byProtocol).flat();
  return all.map((p) => p.toLowerCase());
}

/**
 * Split an array into chunks of a given size.
 */
function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function validatorsFilterActiveByNetwork({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, { validators: string[]; beaconError?: Error } | null>>> {
  const result: Partial<Record<Network, { validators: string[]; beaconError?: Error } | null>> = {};

  const keystoresByNetwork = await keystoresGetByNetwork({ networks });

  const BATCH_SIZE = 100;

  for (const network of networks) {
    const keystores = keystoresByNetwork[network];
    const pubkeys = extractPubkeys(keystores);

    if (pubkeys.length === 0) {
      // No keystores for this network
      result[network] = null;
      continue;
    }

    try {
      const batches = chunk(pubkeys, BATCH_SIZE);
      const activeSets = await Promise.all(batches.map((b) => fetchActivePubkeysForBatch(network, b)));

      // Deduplicate while preserving original input order
      const activeSet = new Set(activeSets.flat());
      const activeInInputOrder = pubkeys.filter((pk) => activeSet.has(pk));

      result[network] = { validators: activeInInputOrder }; // could be []
    } catch (err) {
      // If the beacon request fails for this network returns all the imported keystores
      result[network] = { validators: pubkeys, beaconError: err as Error };
    }
  }

  return result;
}
