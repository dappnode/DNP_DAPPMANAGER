import { logs } from "@dappnode/logger";
import { Network, ValidatorsNetworkData } from "@dappnode/types";
import { keystoresGetByNetwork } from "./keystoresGet.js";

type KeystoresByProtocol = Record<string, string[]>;

const ACTIVE_STATUSES = new Set(["active_ongoing", "active_exiting", "active_slashed"]);

/** Timeout in milliseconds for each individual network's validators data request */
const VALIDATORS_TIMEOUT_MS = 10_000;

const BATCH_SIZE = 50;

/** Cache for SLOTS_PER_EPOCH per network — this value never changes at runtime */
const slotsPerEpochCache = new Map<string, number>();

/** Builds the base URL for a network's beacon chain API */
const ccBaseUrl = (network: Network) => `http://beacon-chain.${network}.dncore.dappnode:3500`;

/**
 * Fetches SLOTS_PER_EPOCH from the beacon node's /eth/v1/config/spec endpoint.
 * The result is cached per network since it is a protocol constant that never changes.
 */
async function getSlotsPerEpoch(network: Network): Promise<number> {
  const cached = slotsPerEpochCache.get(network);
  if (cached !== undefined) return cached;

  const url = new URL(`/eth/v1/config/spec`, ccBaseUrl(network));
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Beacon API ${network} config/spec responded ${res.status} ${res.statusText}`);
  }
  const json: { data?: Record<string, string> } = await res.json();
  const raw = json.data?.SLOTS_PER_EPOCH;
  const value = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Beacon API ${network} config/spec returned invalid SLOTS_PER_EPOCH: ${raw}`);
  }
  slotsPerEpochCache.set(network, value);
  return value;
}

/**
 * Fetches the current head epoch and previous (liveness) epoch for a network.
 * Uses the dynamic SLOTS_PER_EPOCH from the beacon config.
 */
async function getHeadEpochInfo(network: Network): Promise<{ currentEpoch: number; livenessEpoch: number }> {
  const [slotsPerEpoch, headSlot] = await Promise.all([
    getSlotsPerEpoch(network),
    (async () => {
      const url = new URL(`/eth/v1/beacon/headers/head`, ccBaseUrl(network));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) {
        throw new Error(`Beacon API ${network} headers/head responded ${res.status} ${res.statusText}`);
      }
      const json: { data?: { header?: { message?: { slot?: string } } } } = await res.json();
      const slotStr = json?.data?.header?.message?.slot;
      if (!slotStr) throw new Error(`Beacon API ${network} headers/head missing data.header.message.slot`);
      return Number(slotStr);
    })()
  ]);

  const currentEpoch = Math.floor(headSlot / slotsPerEpoch);
  return { currentEpoch, livenessEpoch: currentEpoch - 1 };
}

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

  // Use POST with JSON body instead of GET with query params.
  // The GET endpoint has a maxItems:64 limit and some beacon clients
  // (e.g. Lodestar) fail to parse repeated `id` query params as an array,
  // producing: "querystring/id must be array".
  // The POST variant uses `ids` in the body and avoids these issues.
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ids: normPubkeys })
  });
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
 * Query the liveness endpoint using precomputed index mappings and a
 * pre-fetched liveness epoch (avoids redundant headers/head calls per batch).
 * Returns attesting pubkeys.
 */
async function fetchAttestingFromLiveness(
  network: Network,
  pubkeys: string[],
  pubkeyToIndex: Map<string, string>,
  indexToPubkey: Map<string, string>,
  livenessEpoch: number
): Promise<string[]> {
  const normPubkeys = pubkeys.map((p) => p.toLowerCase());

  const indices = normPubkeys.map((pk) => pubkeyToIndex.get(pk)).filter((x): x is string => !!x);
  if (indices.length === 0) return [];

  const livenessUrl = new URL(`/eth/v1/validator/liveness/${livenessEpoch}`, ccBaseUrl(network));
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
  // Deduplicate: a pubkey might appear in multiple protocols
  return [...new Set(all.map((p) => p.toLowerCase()))];
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

  await Promise.all(
    networks.map(async (network) => {
      const keystores = keystoresByNetwork[network];
      const pubkeys = extractPubkeys(keystores);

      if (pubkeys.length === 0) {
        result[network] = null;
        return;
      }

      try {
        const fetchActive = async (): Promise<{ validators: string[]; beaconError?: Error }> => {
          const batches = chunk(pubkeys, BATCH_SIZE);
          // Use allSettled so one failing batch doesn't discard all results
          const settled = await Promise.allSettled(
            batches.map(async (b) => {
              const { activePubkeys } = await fetchValidatorsBatch(network, b);
              return activePubkeys;
            })
          );

          let beaconError: Error | undefined;
          const activeSets: string[][] = [];
          for (const s of settled) {
            if (s.status === "fulfilled") {
              activeSets.push(s.value);
            } else {
              beaconError = s.reason instanceof Error ? s.reason : new Error(String(s.reason));
              logs.error(`Batch error fetching active validators for ${network}: ${beaconError.message}`);
            }
          }

          const activeSet = new Set(activeSets.flat());
          return { validators: pubkeys.filter((pk) => activeSet.has(pk)), beaconError };
        };

        const activeResult = await Promise.race([
          fetchActive(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after ${VALIDATORS_TIMEOUT_MS}ms`)), VALIDATORS_TIMEOUT_MS)
          )
        ]);

        result[network] = activeResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logs.error(`Error fetching active validators for ${network}: ${message}`);
        result[network] = { validators: pubkeys, beaconError: err as Error };
      }
    })
  );

  return result;
}

/**
 * Fetches validators data for a single network with all the beacon chain calls.
 * Extracted so it can be wrapped with a timeout.
 */
async function fetchValidatorsDataForNetwork(network: Network, pubkeys: string[]): Promise<ValidatorsNetworkData> {
  const batches = chunk(pubkeys, BATCH_SIZE);

  // Fetch head epoch info ONCE for the whole network before processing batches.
  // This avoids redundant headers/head calls and ensures all batches use the same epoch.
  const { livenessEpoch } = await getHeadEpochInfo(network);

  // Use allSettled so one failing batch doesn't discard all results
  const settled = await Promise.allSettled(
    batches.map(async (batch) => {
      const { activePubkeys, balances, pubkeyToIndex, indexToPubkey } = await fetchValidatorsBatch(network, batch);

      let attestingPubkeys: string[] = [];
      let attestingError: Error | undefined;
      try {
        attestingPubkeys = await fetchAttestingFromLiveness(
          network,
          batch,
          pubkeyToIndex,
          indexToPubkey,
          livenessEpoch
        );
      } catch (err) {
        attestingError = err as Error;
      }

      return { activePubkeys, balances, attestingPubkeys, attestingError };
    })
  );

  // Merge batch results, tolerating individual batch failures
  const allActive: string[] = [];
  const mergedBalances: Record<string, string> = {};
  const allAttesting: string[] = [];
  let attestingBeaconError: Error | undefined;
  let activeBeaconError: Error | undefined;

  for (const s of settled) {
    if (s.status === "fulfilled") {
      const br = s.value;
      allActive.push(...br.activePubkeys);
      Object.assign(mergedBalances, br.balances);
      allAttesting.push(...br.attestingPubkeys);
      if (br.attestingError) attestingBeaconError = br.attestingError;
    } else {
      // A batch entirely failed (fetchValidatorsBatch threw)
      const err = s.reason instanceof Error ? s.reason : new Error(String(s.reason));
      logs.error(`Batch error fetching validators data for ${network}: ${err.message}`);
      activeBeaconError = err;
      attestingBeaconError = err;
    }
  }

  const activeSet = new Set(allActive);
  const attestingSet = new Set(allAttesting);

  return {
    active: activeBeaconError
      ? { validators: pubkeys, beaconError: activeBeaconError }
      : { validators: pubkeys.filter((pk) => activeSet.has(pk)) },
    attesting: attestingBeaconError
      ? { validators: pubkeys, beaconError: attestingBeaconError }
      : { validators: pubkeys.filter((pk) => attestingSet.has(pk)) },
    balances: activeBeaconError
      ? { balances: mergedBalances, beaconError: activeBeaconError }
      : { balances: mergedBalances }
  };
}

/**
 * Wraps a single network's validators data fetch with a timeout.
 * On timeout or error, returns data with beaconError set so the UI
 * can still display the other networks.
 */
async function fetchValidatorsDataWithTimeout(network: Network, pubkeys: string[]): Promise<ValidatorsNetworkData> {
  try {
    const result = await Promise.race([
      fetchValidatorsDataForNetwork(network, pubkeys),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${VALIDATORS_TIMEOUT_MS}ms`)), VALIDATORS_TIMEOUT_MS)
      )
    ]);
    return result;
  } catch (err) {
    const beaconError = err as Error;
    const message = beaconError.message || String(err);
    logs.error(`Error fetching validators data for ${network}: ${message}`);
    return {
      active: { validators: pubkeys, beaconError },
      attesting: { validators: pubkeys, beaconError },
      balances: { balances: {}, beaconError }
    };
  }
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

  await Promise.all(
    networks.map(async (network) => {
      const keystores = keystoresByNetwork[network];
      const pubkeys = extractPubkeys(keystores);

      if (pubkeys.length === 0) {
        result[network] = {
          active: null,
          attesting: null,
          balances: null
        };
        return;
      }

      result[network] = await fetchValidatorsDataWithTimeout(network, pubkeys);
    })
  );

  return result;
}
