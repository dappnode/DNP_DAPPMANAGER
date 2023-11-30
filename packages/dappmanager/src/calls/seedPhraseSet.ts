import { decrypt } from "../utils/index.js";
import * as db from "@dappnode/db";
import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";
import fs from "fs";
import { ethers } from "ethers";

const adminPublicKey = params.ADMIN_NACL_PUBLIC_KEY;

/**
 * Receives an encrypted message containing the seed phrase of
 * 12 word mnemonic ethereum account. The extra layer of encryption
 * slightly increases the security of the exchange while the WAMP
 * module works over HTTP.
 *
 * @param seedPhraseEncrypted tweetnacl base64 box with nonce
 */
export async function seedPhraseSet({
  seedPhraseEncrypted
}: {
  seedPhraseEncrypted: string;
}): Promise<void> {
  if (typeof seedPhraseEncrypted !== "string")
    throw Error("kwarg seedPhraseEncrypted must be a string");

  const dappmanagerSecretKey = db.naclSecretKey.get();
  const seedPhrase = decrypt(
    seedPhraseEncrypted,
    dappmanagerSecretKey,
    adminPublicKey
  );

  // Also sets identityAddress
  storePrivateKeyFromSeed(seedPhrase);

  // Notify the UI of the identityAddress and seedPhrase change
  eventBus.requestSystemInfo.emit();
}

// Utils

const privateKeyPath = params.PRIVATE_KEY_PATH;
const standardEthereumDerivationPath = "m/44'/60'/0'/0/0";

interface EthereumKeys {
  privateKey: string;
  publicKey: string;
  address: string;
}

export function seedToPrivateKey(seedPhrase: string): EthereumKeys {
  const seedPhraseArray = seedPhrase.trim().split(/\s+/g);
  if (seedPhraseArray.length !== 12)
    throw Error("seed phrase must contain exactly 12 words");
  const correctedSeedPhrase = seedPhraseArray.join(" ");

  const masterNode = ethers.utils.HDNode.fromMnemonic(correctedSeedPhrase);
  const { privateKey, publicKey, address } = masterNode.derivePath(
    standardEthereumDerivationPath
  );
  return {
    privateKey,
    publicKey,
    address
  };
}

export function storePrivateKeyFromSeed(seedPhrase: string): void {
  const keys = seedToPrivateKey(seedPhrase);
  storePrivateKey(keys);
}

function storePrivateKey(keys: EthereumKeys): void {
  fs.writeFileSync(privateKeyPath, keys.privateKey);
  db.identityAddress.set(keys.address);
}
