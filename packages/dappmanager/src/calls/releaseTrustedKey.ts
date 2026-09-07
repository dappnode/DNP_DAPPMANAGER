import * as db from "@dappnode/db";
import { TrustedReleaseKey, releaseSignatureProtocols } from "@dappnode/types";

/**
 * Add a release key to trusted keys db
 */
export async function releaseTrustedKeyAdd(newTrustedKey: TrustedReleaseKey): Promise<void> {
  if (!newTrustedKey.name) throw Error("Empty key name");
  if (!newTrustedKey.dnpNameSuffix) throw Error("Empty dnpNameSuffix");
  if (!newTrustedKey.signatureProtocol) throw Error("Empty signatureProtocol");
  if (!newTrustedKey.key) throw Error("Empty key");
  if (!releaseSignatureProtocols.includes(newTrustedKey.signatureProtocol)) {
    throw Error(`Unknown signatureProtocol ${newTrustedKey.signatureProtocol}`);
  }

  const trustedKeys = db.releaseKeysTrusted.get();

  // Ensure uniqueness
  const existingKeyIds = new Set(trustedKeys.map(getKeyId));
  const existingKeyNames = new Set(trustedKeys.map((k) => k.name));
  const newKeyId = getKeyId(newTrustedKey);
  if (existingKeyIds.has(newKeyId)) {
    throw Error(`Trusted release key already added: ${newKeyId}`);
  }

  if (existingKeyNames.has(newTrustedKey.name)) {
    throw Error(`Already added a key with name ${newTrustedKey.name}`);
  }

  // Preserve the default list when saving the first customization.
  db.releaseKeysTrusted.set([...trustedKeys, newTrustedKey]);
}

/**
 * Remove a release key from trusted keys db, by name
 */
export async function releaseTrustedKeyRemove(keyName: string, dnpNameSuffix?: string): Promise<void> {
  const trustedKeys = db.releaseKeysTrusted.get();
  const matchesKey = (key: TrustedReleaseKey): boolean =>
    key.name === keyName && (dnpNameSuffix === undefined || key.dnpNameSuffix === dnpNameSuffix);

  if (!trustedKeys.some(matchesKey)) {
    throw Error(`No key with name ${keyName}`);
  }

  db.releaseKeysTrusted.set(trustedKeys.filter((key) => !matchesKey(key)));
}

/**
 * List all keys from trusted keys db
 */
export async function releaseTrustedKeyList(): Promise<TrustedReleaseKey[]> {
  return db.releaseKeysTrusted.get();
}

/** Restore defaults by deleting the saved trusted keys list. */
export async function releaseTrustedKeyReset(): Promise<void> {
  db.releaseKeysTrusted.remove();
}

function getKeyId(key: TrustedReleaseKey): string {
  return `${key.dnpNameSuffix} ${key.signatureProtocol} ${key.key}`;
}
