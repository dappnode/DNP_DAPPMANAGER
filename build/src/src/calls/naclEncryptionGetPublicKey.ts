
import * as db from "../db";
import { RpcHandlerReturn } from "../types";

interface RpcGetNaclPublicKey extends RpcHandlerReturn {
  result: string;
}

/**
 * Returns the public key of nacl's asymmetric encryption,
 * to be used by the ADMIN UI to send sensitive data in a slightly
 * more protected way.
 *
 * @param {string} publicKey
 */
export default async function naclEncryptionGetPublicKey(): Promise<
  RpcGetNaclPublicKey
> {
  const dappmanagerNaclPublicKey = db.naclPublicKey.get();

  return {
    message: `Got DAPPMANAGER nacl public key`,
    result: dappmanagerNaclPublicKey
  };
}
