import { storePrivateKeyFromSeed } from "../utils/seedPhrase";
import { decrypt } from "../utils/publickeyEncryption";
import * as db from "../db";
import params from "../params";
import { RpcHandlerReturn } from "../types";

const adminPublicKey = params.ADMIN_NACL_PUBLIC_KEY;

/**
 * Receives an encrypted message containing the seed phrase of
 * 12 word mnemonic ethereum account. The extra layer of encryption
 * slightly increases the security of the exchange while the WAMP
 * module works over HTTP.
 *
 * @param {string} seedPhraseEncrypted tweetnacl base64 box with nonce
 */
export default async function seedPhraseSet({
  seedPhraseEncrypted
}: {
  seedPhraseEncrypted: string;
}): RpcHandlerReturn {
  if (typeof seedPhraseEncrypted !== "string")
    throw Error("kwarg seedPhraseEncrypted must be a string");

  const dappmanagerSecretKey = db.naclSecretKey.get();
  const seedPhrase = decrypt(
    seedPhraseEncrypted,
    dappmanagerSecretKey,
    adminPublicKey
  );

  storePrivateKeyFromSeed(seedPhrase);

  return {
    message: `Updated seed phrase`,
    logMessage: true,
    userAction: true
  };
}
