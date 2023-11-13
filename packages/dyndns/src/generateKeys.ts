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

// this domain must be stripped of http(s):// tag
const dyndnsDomain = params.DYNDNS_DOMAIN;

function isPrivateKeyValid(privateKey: string): boolean {
  try {
    new ethers.Wallet(privateKey);
    return true;
  } catch (e) {
    logs.warn(`Private key verification failed ethers.Wallet error`, e);
    return false;
  }
}

export default function generateKeys(): void {
  const currentPrivateKey = db.dyndnsIdentity.get().privateKey;
  // Check for corrupted privateKey case
  if (currentPrivateKey) {
    if (isPrivateKeyValid(currentPrivateKey)) {
      logs.info(`Skipping keys generation, found identity in db`);
      return;
    } else {
      logs.warn(corruptedPrivateKeyMessage);
    }
  }

  const identity = ethers.Wallet.createRandom();
  db.dyndnsIdentity.set({
    address: identity.address,
    privateKey: identity.privateKey,
    publicKey: ethers.utils.computePublicKey(identity.privateKey)
  });

  const subdomain = identity.address.toLowerCase().substr(2).substring(0, 16);
  const domain = [subdomain, dyndnsDomain].join(".");
  db.domain.set(domain);
}
