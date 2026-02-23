import { Network, ValidatorsNetworkData } from "@dappnode/types";
import { keystoresGetByNetwork } from "./keystoresGet.js";

type KeystoresByProtocol = Record<string, string[]>;

const ACTIVE_STATUSES = new Set(["active_ongoing", "active_exiting", "active_slashed"]);

type ValidatorEntry = {
  index: string;
  validator: { pubkey: string };
  balance: string;
  status: string;
};

/**
 * calls /eth/v1/beacon/states/head/validators ONCE for a batch
 * and returns all data needed by active, balances, and attesting
 */
async function fetchValidatorsBatch(
  network: Network,
  pubkeys: string[]
): Promise<{
  activePubkeys: string[];
  balances: Record<string, string>;
  pubkeyToIndex: Map<string, string>;
  indexToPubkey: Map<string, string>;
}> {
  const base = `http://beacon-chain.${network}.dncore.dappnode:3500`;
  const normPubkeys = pubkeys.map((p) => p.toLowerCase());
  const url = new URL(`/eth/v1/beacon/states/head/validators`, base);
  const params = new URLSearchParams();
  for (const pk of normPubkeys) params.append("id", pk);
  url.search = params.toString();

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Beacon API ${network} validators responded ${res.status} ${res.statusText}`);
  }

  const json: { data?: ValidatorEntry[] } = await res.json();
  const entries = json.data ?? [];

  const activePubkeys: string[] = [];
  const balances: Record<string, string> = {};
  const pubkeyToIndex = new Map<string, string>();
  const indexToPubkey = new Map<string, string>();

  for (const row of entries) {
    const pk = row.validator?.pubkey?.toLowerCase();
    const idx = row.index;
    if (pk && idx) {
      pubkeyToIndex.set(pk, idx);
      indexToPubkey.set(idx, pk);
    }
    if (pk) {
      balances[pk] = row.balance;
      if (ACTIVE_STATUSES.has(row.status)) {
        activePubkeys.push(pk);
      }
    }
  }

  return { activePubkeys, balances, pubkeyToIndex, indexToPubkey };
}

/**
 * Query the liveness endpoint using precomputed index mappings.
 * Returns attesting pubkeys.
 */
async function fetchAttestingFromLiveness(
  network: Network,
  pubkeys: string[],
  pubkeyToIndex: Map<string, string>,
  indexToPubkey: Map<string, string>
): Promise<string[]> {
  const base = `http://beacon-chain.${network}.dncore.dappnode:3500`;
  const normPubkeys = pubkeys.map((p) => p.toLowerCase());

  // Get current epoch from head
  const headHeaderUrl = new URL(`/eth/v1/beacon/headers/head`, base);
  const headRes = await fetch(headHeaderUrl.toString(), { headers: { Accept: "application/json" } });
  if (!headRes.ok) {
    throw new Error(`Beacon API ${network} headers/head responded ${headRes.status} ${headRes.statusText}`);
  }

  const headJson: { data?: { header?: { message?: { slot?: string } } } } = await headRes.json();
  const slotStr = headJson?.data?.header?.message?.slot;
  if (!slotStr) throw new Error(`Beacon API ${network} headers/head missing data.header.message.slot`);
  const currentEpoch = Math.floor(Number(slotStr) / 32);
  const livenessEpoch = currentEpoch - 1;

  const indices = normPubkeys.map((pk) => pubkeyToIndex.get(pk)).filter((x): x is string => !!x);
  if (indices.length === 0) return [];

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

  return indices
    .filter((idx) => live.has(idx))
    .map((idx) => indexToPubkey.get(idx))
    .filter((pk): pk is string => !!pk);
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
      result[network] = null;
      continue;
    }

    try {
      const batches = chunk(pubkeys, BATCH_SIZE);
      const activeSets = await Promise.all(
        batches.map(async (b) => {
          const { activePubkeys } = await fetchValidatorsBatch(network, b);
          return activePubkeys;
        })
      );

      const activeSet = new Set(activeSets.flat());
      const activeInInputOrder = pubkeys.filter((pk) => activeSet.has(pk));

      result[network] = { validators: activeInInputOrder };
    } catch (err) {
      result[network] = { validators: pubkeys, beaconError: err as Error };
    }
  }

  return result;
}

/**
 * Combined endpoint: for each network, fetches active validators, balances,
 * and attesting validators in a single pass.
 *
 */
export async function validatorsDataByNetwork({
  networks
}: {
  networks: Network[];
}): Promise<Partial<Record<Network, ValidatorsNetworkData>>> {
  const result: Partial<Record<Network, ValidatorsNetworkData>> = {};
  const keystoresByNetwork = await keystoresGetByNetwork({ networks });
  const BATCH_SIZE = 100;

  for (const network of networks) {
    const keystores = keystoresByNetwork[network];
    const pubkeys = extractPubkeys(keystores);

    if (pubkeys.length === 0) {
      result[network] = {
        active: null,
        attesting: null,
        balances: null
      };
      continue;
    }

    try {
      const batches = chunk(pubkeys, BATCH_SIZE);

      // For each batch, call fetchValidatorsBatch ONCE and reuse results for all three concerns
      const batchResults = await Promise.all(
        batches.map(async (batch) => {
          const { activePubkeys, balances, pubkeyToIndex, indexToPubkey } = await fetchValidatorsBatch(network, batch);

          let attestingPubkeys: string[] = [];
          let attestingError: Error | undefined;
          try {
            attestingPubkeys = await fetchAttestingFromLiveness(network, batch, pubkeyToIndex, indexToPubkey);
          } catch (err) {
            attestingError = err as Error;
          }

          return { activePubkeys, balances, attestingPubkeys, attestingError };
        })
      );

      // Merge batch results
      const allActive: string[] = [];
      const mergedBalances: Record<string, string> = {};
      const allAttesting: string[] = [];
      let attestingBeaconError: Error | undefined;

      for (const br of batchResults) {
        allActive.push(...br.activePubkeys);
        Object.assign(mergedBalances, br.balances);
        allAttesting.push(...br.attestingPubkeys);
        if (br.attestingError) attestingBeaconError = br.attestingError;
      }

      const activeSet = new Set(allActive);
      const attestingSet = new Set(allAttesting);

      result[network] = {
        active: { validators: pubkeys.filter((pk) => activeSet.has(pk)) },
        attesting: attestingBeaconError
          ? { validators: pubkeys, beaconError: attestingBeaconError }
          : { validators: pubkeys.filter((pk) => attestingSet.has(pk)) },
        balances: { balances: mergedBalances }
      };
    } catch (err) {
      // If the shared fetch itself fails, all three concerns get the error
      const beaconError = err as Error;
      result[network] = {
        active: { validators: pubkeys, beaconError },
        attesting: { validators: pubkeys, beaconError },
        balances: { balances: {}, beaconError }
      };
    }
  }

  return result;
}
