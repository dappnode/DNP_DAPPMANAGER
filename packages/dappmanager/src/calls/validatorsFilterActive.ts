import { Network } from "@dappnode/types";
import { keystoresGetByNetwork } from "./keystoresGet.js";

type KeystoresByProtocol = Record<string, string[]>;

const ACTIVE_STATUSES = new Set(["active_ongoing", "active_exiting", "active_slashed"]);
/**
 * Query the beacon API for a batch of pubkeys and return the attesting ones (liveness endpoint).
 * Uses (current epoch -1) and converts pubkeys -> indices since liveness endpoint requires indices.
 */

/**
 * For each network, return the attesting validators (using liveness endpoint).
 */
export async function validatorsFilterAttestingByNetwork({
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
      result[network] = null;
      continue;
    }
    try {
      const batches = chunk(pubkeys, BATCH_SIZE);
      const attestingSets = await Promise.all(batches.map((b) => fetchAttestingPubkeysForBatch(network, b)));
      const attestingSet = new Set(attestingSets.flat());
      const attestingInInputOrder = pubkeys.filter((pk) => attestingSet.has(pk));
      result[network] = { validators: attestingInInputOrder };
    } catch (err) {
      result[network] = { validators: pubkeys, beaconError: err as Error };
    }
  }
  return result;
}

/**
 * For each network, return the balances for all validators (as a map pubkey -> balance).
 */
export async function validatorsBalancesByNetwork({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, { balances: Record<string, string>; beaconError?: Error } | null>>> {
  const result: Partial<Record<Network, { balances: Record<string, string>; beaconError?: Error } | null>> = {};
  const keystoresByNetwork = await keystoresGetByNetwork({ networks });
  const BATCH_SIZE = 100;
  for (const network of networks) {
    const keystores = keystoresByNetwork[network];
    const pubkeys = extractPubkeys(keystores);
    if (pubkeys.length === 0) {
      result[network] = null;
      continue;
    }
    try {
      const batches = chunk(pubkeys, BATCH_SIZE);
      const balancesArr = await Promise.all(batches.map((b) => fetchBalancesForBatch(network, b)));
      // Merge all batch results
      const balances: Record<string, string> = {};
      for (const b of balancesArr) Object.assign(balances, b);
      result[network] = { balances };
    } catch (err) {
      result[network] = { balances: {}, beaconError: err as Error };
    }
  }
  return result;
}

async function fetchAttestingPubkeysForBatch(network: Network, pubkeys: string[]): Promise<string[]> {
  const base = `http://beacon-chain.${network}.dncore.dappnode:3500`;
  const normPubkeys = pubkeys.map((p) => p.toLowerCase());

  // Get current epoch from head. Use last completed epoch = currentEpoch - 1
  const headHeaderUrl = new URL(`/eth/v1/beacon/headers/head`, base);
  console.log(`[fetchAttestingPubkeysForBatch] headHeaderUrl:`, headHeaderUrl.toString());

  const headRes = await fetch(headHeaderUrl.toString(), { headers: { Accept: "application/json" } });
  if (!headRes.ok) {
    throw new Error(`Beacon API ${network} headers/head responded ${headRes.status} ${headRes.statusText}`);
  }

  const headJson: { data?: { header?: { message?: { slot?: string } } } } = await headRes.json();

  const slotStr = headJson?.data?.header?.message?.slot;
  if (!slotStr) throw new Error(`Beacon API ${network} headers/head missing data.header.message.slot`);
  fetchAttestingPubkeysForBatch;
  const currentEpoch = Math.floor(Number(slotStr) / 32);
  const livenessEpoch = currentEpoch - 1; // "last epoch" and widely supported

  // Query validators endpoint to convert pubkeys -> indices
  const validatorsUrl = new URL(`/eth/v1/beacon/states/head/validators`, base);
  const params = new URLSearchParams();
  for (const pk of normPubkeys) params.append("id", pk);
  validatorsUrl.search = params.toString();

  const vRes = await fetch(validatorsUrl.toString(), { headers: { Accept: "application/json" } });
  if (!vRes.ok) {
    throw new Error(`Beacon API ${network} validators responded ${vRes.status} ${vRes.statusText}`);
  }

  type ValidatorEntry = { index: string; validator: { pubkey: string } };
  const vJson: { data?: ValidatorEntry[] } = await vRes.json();

  const pubkeyToIndex = new Map<string, string>();
  const indexToPubkey = new Map<string, string>();
  for (const row of vJson.data ?? []) {
    const pk = row.validator?.pubkey?.toLowerCase();
    const idx = row.index;
    if (pk && idx) {
      pubkeyToIndex.set(pk, idx);
      indexToPubkey.set(idx, pk);
    }
  }

  const indices = normPubkeys.map((pk) => pubkeyToIndex.get(pk)).filter((x): x is string => !!x);

  if (indices.length === 0) return [];

  // 3) Liveness expects body: ["1","2",...]
  const livenessUrl = new URL(`/eth/v1/validator/liveness/${livenessEpoch}`, base);

  const res = await fetch(livenessUrl.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(indices)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");

    throw new Error(
      `Beacon API ${network} liveness responded ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`
    );
  }

  type LivenessEntry = { index: string; is_live: boolean };
  const json: { data?: LivenessEntry[] } = await res.json();

  const live = new Set((json.data ?? []).filter((x) => x.is_live).map((x) => x.index));

  // Return pubkeys that are live (lowercased)
  const result = indices
    .filter((idx) => live.has(idx))
    .map((idx) => indexToPubkey.get(idx))
    .filter((pk): pk is string => !!pk);

  return result;
}

/**
 * Query the beacon API for a batch of pubkeys and return their balances.
 */
async function fetchBalancesForBatch(network: Network, pubkeys: string[]): Promise<Record<string, string>> {
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
    balance: string;
    status: string;
    index?: string;
  };

  const json: { data: ValidatorEntry[] } = await res.json();
  const out: Record<string, string> = {};
  for (const v of json.data ?? []) {
    out[v.validator.pubkey.toLowerCase()] = v.balance;
  }
  return out;
}

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
