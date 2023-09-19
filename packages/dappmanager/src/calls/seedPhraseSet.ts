import { storePrivateKeyFromSeed } from "../utils/seedPhrase.js";
import { decrypt } from "../utils/publickeyEncryption.js";
import * as db from "../db/index.js";
import { eventBus } from "@dappnode/eventbus";
import { params } from "@dappnode/params";

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
