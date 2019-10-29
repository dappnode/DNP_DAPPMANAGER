import * as db from "../db";
import { RpcHandlerReturn } from "../types";

interface RpcGetIdentityPublicKey extends RpcHandlerReturn {
  result: string;
}

/**
 * Returns the public key of the seedPhrase currently stored if any.
 * If it's not stored yet, it's an empty string
 *
 * @returns {string} publicKey
 */
export default async function seedPhraseGetPublicKey(): Promise<
  RpcGetIdentityPublicKey
> {
  const identityAddress = db.identityAddress.get();

  return {
    message: `Got identity address`,
    result: identityAddress
  };
}
