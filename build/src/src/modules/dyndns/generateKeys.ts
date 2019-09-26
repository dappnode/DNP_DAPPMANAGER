import EthCrypto from "eth-crypto";
import params from "../../params";
import * as db from "../../db";
import Logs from "../../logs";
const logs = Logs(module);

const corruptedPrivateKeyMessage = `


=====================================================================
    Found corrupted privateKey.
    Reseting DYNDNS subdomain, please update your user's profiles
=====================================================================


`;

// this domain must be stripped of http(s):// tag
const dyndnsDomain = params.DYNDNS_DOMAIN;

/**
 * EthCrypto reference
 *
 * - Create private key
 * const identity = EthCrypto.createIdentity();
 * {
      address: '0x3f243FdacE01Cfd9719f7359c94BA11361f32471',
      privateKey: '0x107be9...',
      publicKey: 'bf1cc315...'
  }
 *
 * - From private key to public key
 * const publicKey = EthCrypto.publicKeyByPrivateKey('0x107be9...);
 * - Publick key to address
 * const address = EthCrypto.publicKey.toAddress('bf1cc315...);
 *
 * - Sign message
 * const message = 'foobar';
   const messageHash = EthCrypto.hash.keccak256(message);
   const signature = EthCrypto.sign(privateKey, messageHash);
 */

function isPrivateKeyValid(privateKey: string): boolean {
  try {
    EthCrypto.publicKeyByPrivateKey(privateKey);
    return true;
  } catch (e) {
    logs.warn(
      `Private key verification failed. EthCrypto.publicKeyByPrivateKey returned error: ${
        e.stack
      }`
    );
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

  const identity = EthCrypto.createIdentity();
  db.dyndnsIdentity.set({
    address: identity.address,
    privateKey: identity.privateKey,
    publicKey: identity.publicKey
  });

  const subdomain = identity.address
    .toLowerCase()
    .substr(2)
    .substring(0, 16);
  const domain = [subdomain, dyndnsDomain].join(".");
  db.domain.set(domain);
}
