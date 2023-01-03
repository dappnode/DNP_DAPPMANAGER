import * as db from "../db";
import { TrustedReleaseKey, releaseSignatureProtocols } from "@dappnode/common";

/**
 * Add a release key to trusted keys db
 */
export async function releaseTrustedKeyAdd(
  newTrustedKey: TrustedReleaseKey
): Promise<void> {
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
  const existingKeyNames = new Set(trustedKeys.map(k => k.name));
  const newKeyId = getKeyId(newTrustedKey);
  if (existingKeyIds.has(newKeyId)) {
    throw Error(`Trusted release key already added: ${newKeyId}`);
  }

  if (existingKeyNames.has(newTrustedKey.name)) {
    throw Error(`Already added a key with name ${newTrustedKey.name}`);
  }

  // Safe to push, key is checked to be unique
  trustedKeys.push(newTrustedKey);
  db.releaseKeysTrusted.set(trustedKeys);
}

/**
 * Remove a release key from trusted keys db, by name
 */
export async function releaseTrustedKeyRemove(keyName: string): Promise<void> {
  const trustedKeys = db.releaseKeysTrusted.get();
  const existingKeyNames = new Set(trustedKeys.map(k => k.name));

  if (!existingKeyNames.has(keyName)) {
    throw Error(`No key with name ${keyName}`);
  }

  trustedKeys.filter(key => key.name !== keyName);
  db.releaseKeysTrusted.set(trustedKeys);
}

/**
 * List all keys from trusted keys db
 */
export async function releaseTrustedKeyList(): Promise<TrustedReleaseKey[]> {
  return db.releaseKeysTrusted.get();
}

function getKeyId(key: TrustedReleaseKey): string {
  return `${key.dnpNameSuffix} ${key.signatureProtocol} ${key.key}`;
}
