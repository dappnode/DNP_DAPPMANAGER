import { ethers } from "ethers";
import { params } from "@dappnode/params";
import * as db from "@dappnode/db";
import { logs } from "@dappnode/logger";

const corruptedPrivateKeyMessage = `


=====================================================================
    Found corrupted privateKey.
    Reseting DYNDNS subdomain, please update your user's profiles
=====================================================================


`;

export function isPrivateKeyValid(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch (e) {
    logs.warn(`Private key verification failed ethers.Wallet error`, e);
    return false;
  }
}
/**
 * This function is used to generate a new identity for the user
 * it is critical and might not work for some node versions
 * @returns a new ethers.Wallet
 */
export function generateDyndnsIdentity(): ethers.HDNodeWallet {
  return ethers.Wallet.createRandom();
}

export function getDomainFromIdentityAddress(identityAddress: string): string {
  const subdomain = identityAddress.toLowerCase().substring(2, 18);
  // this domain must be stripped of http(s):// tag
  return [subdomain, params.DYNDNS_DOMAIN].join(".");
}

/**
 * This function is used to generate a new identity for the user
 * Its called in the initializeDb.
 *
 * - If the identity is not found in the db, it generates a new one and stores it.
 * - If the identity is found in the db, it checks if the privateKey is valid:
 *    - If it is valid, it skips the generation.
 *    - If it is not valid, it prints an error message, it generates a new one and stores it.
 */
export function generateKeysIfNotExistOrNotValid(): void {
  const currentPrivateKey = db.dyndnsIdentity.get().privateKey;
  // Check for corrupted privateKey case
  if (currentPrivateKey) {
    if (isPrivateKeyValid(currentPrivateKey)) {
      logs.info(`Skipping keys generation, found identity in db`);
      return;
    } else logs.warn(corruptedPrivateKeyMessage);
  }

  const identity = generateDyndnsIdentity();
  const { address, publicKey, privateKey } = identity;
  db.dyndnsIdentity.set({
    address,
    privateKey,
    publicKey
  });

  db.domain.set(getDomainFromIdentityAddress(address));
}
