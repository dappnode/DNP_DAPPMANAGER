import { Network } from "@dappnode/types";
import { BrainValidatorsResponse } from "./types.js";
import { getBrainUrl } from "./params.js";

/**
 * Fetches validator indices from the brain web3signer API.
 * Uses format=index to get indices instead of pubkeys.
 *
 * @param network - The network to fetch validators for
 * @returns Response mapping tags to arrays of index strings, or null on error
 * @throws Error if the HTTP request fails with a non-OK status
 */
export async function fetchBrainValidators(
  network: Network
): Promise<BrainValidatorsResponse | null> {
  const brainUrl = getBrainUrl(network);
  const url = `${brainUrl}/api/v0/brain/validators?format=index`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Brain API request failed with status: ${response.status}`);
  }

  const data = await response.json();
  return data as BrainValidatorsResponse;
}
