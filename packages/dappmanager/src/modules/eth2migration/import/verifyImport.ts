import { extendError } from "../../../utils/extendError";
import fetch from "node-fetch";
import { logs } from "../../../logs";

/**
 * Verifies the eth2migration import was done succesfully:
 * - web3signer contains validator files: list keystores with
 */
export async function verifyImport({
  signerDnpName
}: {
  signerDnpName: string;
}): Promise<void> {
  try {
    const response = await fetch(
      `http://${signerDnpName}/api/v1/eth2/publicKeys`,
      {
        method: "get",
        headers: { "Content-Type": "application/json" }
      }
    );

    const pubKeys = await response.json();
    if (pubKeys.length === 0) {
      throw new Error("No validator public keys found");
    }
    logs.info(
      "Eth2 migration: verifyImport succesful for public keys: ",
      pubKeys
    );
  } catch (e) {
    throw extendError(e, "Eth2 migration: verifyImport failed");
  }
}
