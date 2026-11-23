import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import tar from "tar-stream";
import { buildNetworkAlias, yamlParse } from "@dappnode/utils";
import { FullBackupItemEntry, InstalledPackageData } from "@dappnode/types";

/**
 * Web3Signer keeps its slashing protection in Postgres, which a file copy
 * cannot capture exactly. Backups made to move or reinstall a node delete
 * the validator keys through the package's Staking Brain (keymanager API,
 * DELETE /eth/v1/keystores): the response holds the EIP-3076 interchange,
 * exact at that moment, and the old node can no longer sign with those keys.
 * Restore imports the keys through the brain with that interchange.
 */

export function isWeb3signerPackage(dnpName: string): boolean {
  return dnpName.startsWith("web3signer");
}

/** The brain's API, Web3Signer and the Postgres that holds its slashing protection */
const KEY_SERVICES = ["brain", "web3signer", "postgres"];

/**
 * Services needed to move keys through the brain that are not running. The
 * package's other containers do not count: its `flyway` migration service
 * is one-shot and has always exited
 */
export function stoppedKeyServices(pkg: Pick<InstalledPackageData, "containers">): string[] {
  return KEY_SERVICES.filter((serviceName) => !pkg.containers.some((c) => c.serviceName === serviceName && c.running));
}

/** Keymanager per-key result, as returned by Web3Signer through the brain */
export interface KeymanagerResult {
  status: string;
  message?: string;
}

export interface BrainImportRequest {
  keystores: string[];
  passwords: string[];
  tags: string[];
  feeRecipients: string[];
  slashing_protection?: string;
}

/** The Staking Brain's launchpad API, which wraps Web3Signer's keymanager API */
export interface BrainClient {
  /** Public keys loaded in Web3Signer */
  listKeys(): Promise<string[]>;
  deleteKeys(pubkeys: string[]): Promise<{ data: KeymanagerResult[]; slashing_protection?: string }>;
  importKeys(request: BrainImportRequest): Promise<{ data: KeymanagerResult[] }>;
}

/** EIP-3076 slashing protection interchange */
export interface SlashingInterchange {
  metadata: Record<string, unknown>;
  data: { pubkey: string; [key: string]: unknown }[];
}

/** Port of the brain's launchpad API, used by other packages to manage keys */
const BRAIN_LAUNCHPAD_PORT = 3000;
const LIST_TIMEOUT_MS = 30 * 1000;
/** The brain waits up to 2 minutes for Web3Signer to delete */
const DELETE_TIMEOUT_MS = 5 * 60 * 1000;
/** The brain waits up to 10 minutes for Web3Signer to decrypt and import */
const IMPORT_TIMEOUT_MS = 12 * 60 * 1000;
/** The brain answers 503 while another key operation holds its lock; nothing was changed */
const BUSY_RETRIES = 12;
const BUSY_RETRY_MS = 10 * 1000;
/** Keystore decryption is slow: import in batches well within the brain's timeout */
const IMPORT_BATCH_SIZE = 50;
/**
 * The brain rejects request bodies over 8 MiB (RPC_MAX_PAYLOAD_BYTES) with
 * HTTP 413, and a long slashing history weighs far more than its keystore:
 * batches are also cut by size, with a margin
 */
const IMPORT_BATCH_MAX_BYTES = 6 * 1024 * 1024;
const PAYLOAD_TOO_LARGE = 413;
/** Tag and fee recipient the brain itself uses when it knows nothing about a key */
const DEFAULT_TAG = "solo";
const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";
/** The keystores folder of a node is small; refuse to read more */
const MAX_TAR_BYTES = 256 * 1024 * 1024;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** The brain answered a request with an HTTP error */
export class BrainRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "BrainRequestError";
  }
}

/** brain.web3signer-hoodi.dappnode, brain.web3signer.dappnode, ... on dncore_network */
export function brainHostname(dnpName: string): string {
  return buildNetworkAlias({ dnpName, serviceName: "brain", isMainOrMonoservice: false });
}

export function createBrainClient(dnpName: string): BrainClient {
  const url = `http://${brainHostname(dnpName)}:${BRAIN_LAUNCHPAD_PORT}/eth/v1/keystores`;

  async function request<T>(method: "GET" | "POST" | "DELETE", body: unknown, timeoutMs: number): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, {
        method,
        headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (res.status === 503 && attempt < BUSY_RETRIES) {
        await res.body?.cancel();
        await sleep(BUSY_RETRY_MS);
        continue;
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text;
        try {
          message = JSON.parse(text).message ?? text;
        } catch {
          // Not JSON
        }
        throw new BrainRequestError(
          `Staking Brain of ${dnpName} answered ${method} with HTTP ${res.status}: ${message}`,
          res.status
        );
      }
      return (await res.json()) as T;
    }
  }

  return {
    async listKeys() {
      const res = await request<{ data?: { validating_pubkey: string }[] }>("GET", null, LIST_TIMEOUT_MS);
      if (!Array.isArray(res?.data)) throw Error("Unexpected response listing the validator keys");
      return res.data.map((key) => key.validating_pubkey);
    },
    deleteKeys: (pubkeys) => request("DELETE", { pubkeys }, DELETE_TIMEOUT_MS),
    importKeys: (importRequest) => request("POST", importRequest, IMPORT_TIMEOUT_MS)
  };
}

/**
 * Wait until the brain answers and reaches Web3Signer: right after an
 * install, Postgres, its migrations, Web3Signer and the brain all start
 */
export async function waitForBrain(
  client: BrainClient,
  { timeoutMs = 10 * 60 * 1000, intervalMs = 5000 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      await client.listKeys();
      return;
    } catch (e) {
      if (Date.now() >= deadline) {
        throw Error(`The Staking Brain did not become ready in ${Math.round(timeoutMs / 60000)} minutes: ${e.message}`);
      }
      await sleep(intervalMs);
    }
  }
}

export function normalizePubkey(pubkey: string): string {
  const lower = pubkey.toLowerCase();
  return lower.startsWith("0x") ? lower : `0x${lower}`;
}

export const shortPubkey = (pubkey: string): string => `${pubkey.slice(0, 10)}...${pubkey.slice(-4)}`;

/** The first few of a list that may hold thousands of keys */
export function someOf(items: string[], max = 5): string {
  const shown = items.slice(0, max).join(", ");
  return items.length > max ? `${shown} and ${items.length - max} more` : shown;
}

export function isInterchange(value: unknown): value is SlashingInterchange {
  const interchange = value as SlashingInterchange | null;
  return (
    typeof interchange === "object" &&
    interchange !== null &&
    typeof interchange.metadata === "object" &&
    interchange.metadata !== null &&
    Array.isArray(interchange.data) &&
    interchange.data.every((entry) => typeof entry?.pubkey === "string")
  );
}

export function parseInterchange(text: string): SlashingInterchange {
  let interchange: unknown;
  try {
    interchange = JSON.parse(text);
  } catch {
    throw Error("The slashing protection returned by Web3Signer is not valid JSON");
  }
  if (!isInterchange(interchange)) {
    throw Error("The slashing protection returned by Web3Signer is not an EIP-3076 interchange");
  }
  return interchange;
}

/** Keys an interchange holds slashing protection for */
export function interchangePubkeys(interchange: SlashingInterchange): Set<string> {
  return new Set(interchange.data.map((entry) => normalizePubkey(entry.pubkey)));
}

/** Only the entries of these keys, so each import batch carries its own */
export function filterInterchange(interchange: SlashingInterchange, pubkeys: string[]): SlashingInterchange {
  const keep = new Set(pubkeys.map(normalizePubkey));
  return { ...interchange, data: interchange.data.filter((entry) => keep.has(normalizePubkey(entry.pubkey))) };
}

// Export
// ======

/**
 * The delete failed or was incomplete. `deletedPubkeys` may no longer be
 * loaded in Web3Signer and must be imported back
 */
export class SlashingExportError extends Error {
  constructor(
    message: string,
    readonly deletedPubkeys: string[],
    readonly interchange: SlashingInterchange | null
  ) {
    super(message);
    this.name = "SlashingExportError";
  }
}

/**
 * Web3Signer removed the key and exported the slashing protection it had
 * for it. Not `not_found`: the key was loaded a moment ago, so something
 * else removed it, and Web3Signer exports nothing for it
 */
const REMOVED_STATUSES = new Set(["deleted", "not_active"]);

/**
 * The keys loaded in Web3Signer, once the copy of its keystores is known to
 * restore every one of them. The delete removes the keystore files, so a
 * key without a keystore and its password in that copy (a password file
 * missing or named differently, a raw key or remote signer config, a key
 * added after the copy) would be lost: throws before anything is deleted.
 */
export async function listKeysInBackup(
  client: BrainClient,
  backedUp: Parameters<typeof readBackedUpKeys>[0]
): Promise<string[]> {
  const pubkeys = [...new Set((await client.listKeys()).map(normalizePubkey))];
  if (pubkeys.length === 0) return pubkeys;
  const { keystores, unsupported } = await readBackedUpKeys(backedUp);
  const missing = pubkeys.filter((pubkey) => !keystores.has(pubkey));
  if (missing.length > 0) {
    throw Error(
      `${missing.length} of the ${pubkeys.length} validator keys loaded in Web3Signer have no keystore with its password in the copy of its keystores (${someOf(missing.map(shortPubkey))})${unsupported.length > 0 ? `. Not restorable from that copy: ${someOf(unsupported)}` : ""}`
    );
  }
  return pubkeys;
}

/**
 * Delete these keys from Web3Signer through the brain and return their exact
 * slashing protection. Only the given keys are deleted, never one the
 * caller has not checked. Throws SlashingExportError if any key could not be
 * deleted, is still loaded afterwards, or the interchange is missing.
 *
 * `withoutHistory` are deleted keys the interchange has no entry for:
 * Web3Signer exports none for a key that has never signed (it has no low
 * watermark), so for them the backup holds no slashing protection.
 * `notRemoved` are keys loaded afterwards that were not asked for: added
 * while the backup was running.
 */
export async function exportSlashingProtection(
  client: BrainClient,
  pubkeys: string[]
): Promise<{
  pubkeys: string[];
  interchange: SlashingInterchange | null;
  withoutHistory: string[];
  notRemoved: string[];
}> {
  if (pubkeys.length === 0) return { pubkeys, interchange: null, withoutHistory: [], notRemoved: [] };

  let response: Awaited<ReturnType<BrainClient["deleteKeys"]>>;
  try {
    response = await client.deleteKeys(pubkeys);
  } catch (e) {
    // The outcome is unknown: keys missing from the signer now were deleted
    const remaining = await client
      .listKeys()
      .then((keys) => new Set(keys.map(normalizePubkey)))
      .catch(() => null);
    const deleted = remaining ? pubkeys.filter((key) => !remaining.has(key)) : pubkeys;
    throw new SlashingExportError(
      `Removing the validator keys through the Staking Brain failed: ${e.message}`,
      deleted,
      null
    );
  }

  const removed: string[] = [];
  const problems: string[] = [];
  pubkeys.forEach((pubkey, index) => {
    const result = response?.data?.[index];
    if (result && REMOVED_STATUSES.has(result.status)) removed.push(pubkey);
    else if (result?.status === "not_found") {
      problems.push(`${shortPubkey(pubkey)}: Web3Signer no longer had it and exported no slashing protection for it`);
    } else problems.push(`${shortPubkey(pubkey)}: ${result?.message || result?.status || "no result"}`);
  });

  let interchange: SlashingInterchange | null = null;
  try {
    if (response?.slashing_protection) interchange = parseInterchange(response.slashing_protection);
    else if (removed.length > 0) problems.push("Web3Signer returned no slashing protection");
  } catch (e) {
    problems.push(e.message);
  }

  let notRemoved: string[] = [];
  try {
    const loaded = (await client.listKeys()).map(normalizePubkey);
    const stillLoaded = loaded.filter((key) => pubkeys.includes(key));
    for (const key of stillLoaded) {
      if (removed.includes(key)) problems.push(`${shortPubkey(key)}: still loaded after being deleted`);
    }
    removed.splice(0, removed.length, ...removed.filter((key) => !stillLoaded.includes(key)));
    notRemoved = loaded.filter((key) => !pubkeys.includes(key));
  } catch (e) {
    problems.push(`could not check that the keys were removed: ${e.message}`);
  }

  if (problems.length > 0) {
    throw new SlashingExportError(
      `${removed.length} of ${pubkeys.length} validator keys were removed from Web3Signer, but: ${problems.join("; ")}`,
      removed,
      interchange
    );
  }
  const exported = interchange ? interchangePubkeys(interchange) : new Set<string>();
  return { pubkeys: removed, interchange, withoutHistory: removed.filter((key) => !exported.has(key)), notRemoved };
}

// Keystores from a backup
// =======================

/** Regular files of a tar produced by the docker archive API, by entry name */
export async function readTarFiles(tarPath: string): Promise<Map<string, Buffer>> {
  const files = new Map<string, Buffer>();
  let total = 0;
  const extract = tar.extract();
  extract.on("entry", (header, stream, next) => {
    if (header.type !== "file") {
      stream.on("end", next);
      stream.resume();
      return;
    }
    total += header.size ?? 0;
    if (total > MAX_TAR_BYTES) {
      stream.resume();
      extract.destroy(Error("Keystores archive is too large"));
      return;
    }
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => {
      files.set(path.posix.normalize(header.name.replace(/^\.\//, "")), Buffer.concat(chunks));
      next();
    });
  });
  await pipeline(fs.createReadStream(tarPath), extract);
  return files;
}

export interface BackedUpKeystore {
  pubkey: string;
  keystore: string;
  password: string;
}

/** Web3Signer reads only the first line of a password file */
function readPassword(data: Buffer): string {
  return data.toString("utf8").split(/\r?\n/)[0];
}

function keystorePubkey(data: Buffer): string | null {
  try {
    const keystore = JSON.parse(data.toString("utf8"));
    if (typeof keystore?.pubkey !== "string" || typeof keystore?.crypto !== "object") return null;
    const pubkey = normalizePubkey(keystore.pubkey);
    return /^0x[0-9a-f]{96}$/.test(pubkey) ? pubkey : null;
  } catch {
    return null;
  }
}

/**
 * Pair each EIP-2335 keystore of a Web3Signer keystores folder with its
 * password. The folder holds, per key imported through the keymanager API,
 * `<id>.json` (keystore), `<id>.password` and `<id>.yaml` (Web3Signer
 * config pointing to both). The yaml files are followed first, since older
 * installs and keys added by hand may use other names; paths under the old
 * /opt/web3signer/keyfiles location are mapped to the current one. Configs
 * that are not file keystores (raw keys, remote signers) cannot be imported
 * through the keymanager API and are returned as unsupported.
 */
export function findKeystores(
  files: Map<string, Buffer>,
  keystoresPath: string
): { keystores: Map<string, BackedUpKeystore>; unsupported: string[] } {
  const base = path.posix.dirname(keystoresPath);
  const toEntryName = (absPath: string): string => {
    const mapped = absPath.replace(/^\/opt\/web3signer\/keyfiles(?=\/)/, keystoresPath);
    return path.posix.relative(base, path.posix.normalize(mapped));
  };
  const keystores = new Map<string, BackedUpKeystore>();
  const unsupported: string[] = [];

  for (const [name, data] of files) {
    if (!/\.ya?ml$/i.test(name)) continue;
    let config: Record<string, unknown>;
    try {
      config = yamlParse<Record<string, unknown>>(data.toString("utf8"));
    } catch {
      unsupported.push(`${path.posix.basename(name)} (unreadable config)`);
      continue;
    }
    if (config?.type !== "file-keystore") {
      unsupported.push(`${path.posix.basename(name)} (${String(config?.type ?? "unknown type")})`);
      continue;
    }
    const keystoreFile = typeof config.keystoreFile === "string" ? files.get(toEntryName(config.keystoreFile)) : null;
    const passwordFile =
      typeof config.keystorePasswordFile === "string" ? files.get(toEntryName(config.keystorePasswordFile)) : null;
    const pubkey = keystoreFile ? keystorePubkey(keystoreFile) : null;
    if (!keystoreFile || !passwordFile || !pubkey) {
      unsupported.push(`${path.posix.basename(name)} (keystore or password not in the backup)`);
      continue;
    }
    keystores.set(pubkey, { pubkey, keystore: keystoreFile.toString("utf8"), password: readPassword(passwordFile) });
  }

  // Keystores without a config: pair them with a password of the same name
  for (const [name, data] of files) {
    if (!name.endsWith(".json")) continue;
    const pubkey = keystorePubkey(data);
    if (!pubkey || keystores.has(pubkey)) continue;
    const password = files.get(name.replace(/\.json$/, ".password")) ?? files.get(name.replace(/\.json$/, ".txt"));
    if (password) keystores.set(pubkey, { pubkey, keystore: data.toString("utf8"), password: readPassword(password) });
  }

  return { keystores, unsupported };
}

export interface BrainValidatorSettings {
  tag: string;
  feeRecipient: string;
}

/** Tag and fee recipient per key from the brain's lowdb file (brain-db.json) */
export function readBrainSettings(files: Map<string, Buffer>): Map<string, BrainValidatorSettings> {
  const settings = new Map<string, BrainValidatorSettings>();
  const entry = [...files.entries()].find(([name]) => path.posix.basename(name) === "brain-db.json");
  if (!entry) return settings;
  const data = JSON.parse(entry[1].toString("utf8")) as Record<string, Partial<BrainValidatorSettings>>;
  for (const [pubkey, details] of Object.entries(data ?? {})) {
    if (typeof details?.tag === "string" && typeof details?.feeRecipient === "string") {
      settings.set(normalizePubkey(pubkey), { tag: details.tag, feeRecipient: details.feeRecipient });
    }
  }
  return settings;
}

/** The Web3Signer package's `backup` items, as declared by its manifest */
export function findWeb3signerItems<T extends Pick<FullBackupItemEntry, "name" | "path">>(
  items: T[]
): { keystores?: T; brainDb?: T } {
  return {
    keystores: items.find((item) => item.name === "keystores" || item.path.endsWith("/keyfiles")),
    brainDb: items.find((item) => item.name === "brain-db" || item.path.endsWith("/brain-db.json"))
  };
}

/** Keystores and brain settings from the docker archive tars of a backup */
export async function readBackedUpKeys({
  keystoresTar,
  keystoresPath,
  brainDbTar
}: {
  keystoresTar: string;
  keystoresPath: string;
  brainDbTar: string | null;
}): Promise<{
  keystores: Map<string, BackedUpKeystore>;
  unsupported: string[];
  settings: Map<string, BrainValidatorSettings>;
}> {
  const { keystores, unsupported } = findKeystores(await readTarFiles(keystoresTar), keystoresPath);
  const settings = brainDbTar ? readBrainSettings(await readTarFiles(brainDbTar)) : new Map();
  return { keystores, unsupported, settings };
}

// Import
// ======

const jsonBytes = (value: unknown): number => Buffer.byteLength(JSON.stringify(value));

/**
 * Import keys through the brain, in batches, each with the slashing
 * protection of its own keys. The brain records each key with its tag and
 * fee recipient and adds it to the validator client.
 *
 * Keys Web3Signer already has are returned as `duplicates`, apart from
 * `imported`: Web3Signer imports slashing protection only for the keys an
 * import adds (ImportKeystoresHandler, "import slashing protection data for
 * all to-be-IMPORTED keys"), so theirs was not written by this import.
 */
export async function importKeysThroughBrain(
  client: BrainClient,
  {
    keystores,
    settings,
    interchange
  }: {
    keystores: BackedUpKeystore[];
    settings: Map<string, BrainValidatorSettings>;
    interchange: SlashingInterchange | null;
  }
): Promise<{ imported: string[]; duplicates: string[]; failed: string[]; withoutSettings: string[] }> {
  const imported: string[] = [];
  const duplicates: string[] = [];
  const failed: string[] = [];
  const withoutSettings: string[] = [];

  const keys = keystores.map((key) => {
    const found = settings.get(key.pubkey);
    if (!found) withoutSettings.push(key.pubkey);
    return { ...key, ...(found ?? { tag: DEFAULT_TAG, feeRecipient: BURN_ADDRESS }) };
  });
  type Key = (typeof keys)[number];

  const toRequest = (batch: Key[]): BrainImportRequest => ({
    keystores: batch.map((key) => key.keystore),
    passwords: batch.map((key) => key.password),
    tags: batch.map((key) => key.tag),
    feeRecipients: batch.map((key) => key.feeRecipient),
    ...(interchange
      ? {
          slashing_protection: JSON.stringify(
            filterInterchange(
              interchange,
              batch.map((key) => key.pubkey)
            )
          )
        }
      : {})
  });

  // Bytes each key adds to the request body. The interchange travels as a
  // JSON string inside JSON, so its entries are measured escaped twice
  const slashingBytes = new Map<string, number>();
  for (const entry of interchange?.data ?? []) {
    const pubkey = normalizePubkey(entry.pubkey);
    slashingBytes.set(pubkey, (slashingBytes.get(pubkey) ?? 0) + jsonBytes(JSON.stringify(entry)) - 1);
  }
  const baseBytes = jsonBytes(toRequest([]));
  const keyBytes = (key: Key): number =>
    jsonBytes(key.keystore) +
    jsonBytes(key.password) +
    jsonBytes(key.tag) +
    jsonBytes(key.feeRecipient) +
    4 +
    (slashingBytes.get(key.pubkey) ?? 0);

  let maxBytes = IMPORT_BATCH_MAX_BYTES;
  for (let next = 0; next < keys.length;) {
    // Always at least one key, however large
    const batch = [keys[next]];
    let bytes = baseBytes + keyBytes(keys[next]);
    for (const key of keys.slice(next + 1, next + IMPORT_BATCH_SIZE)) {
      if (bytes + keyBytes(key) > maxBytes) break;
      batch.push(key);
      bytes += keyBytes(key);
    }

    try {
      const response = await client.importKeys(toRequest(batch));
      batch.forEach(({ pubkey }, index) => {
        const result = response?.data?.[index];
        if (result?.status === "imported") imported.push(pubkey);
        else if (result?.status === "duplicate") duplicates.push(pubkey);
        else failed.push(`${shortPubkey(pubkey)}: ${result?.message || result?.status || "no result"}`);
      });
    } catch (e) {
      const tooLarge = e instanceof BrainRequestError && e.status === PAYLOAD_TOO_LARGE;
      // The brain refused the body before importing anything (older brains
      // accept far less than 8 MiB): cut this batch and the next ones smaller
      if (tooLarge && batch.length > 1) {
        maxBytes = Math.floor(bytes / 2);
        continue;
      }
      for (const key of batch) {
        failed.push(
          tooLarge
            ? `${shortPubkey(key.pubkey)}: its keystore and slashing protection (${(keyBytes(key) / 1024 / 1024).toFixed(1)} MiB) are larger than the Staking Brain accepts in one request`
            : `${shortPubkey(key.pubkey)}: ${e.message}`
        );
      }
    }
    next += batch.length;
  }

  return { imported, duplicates, failed, withoutSettings };
}
