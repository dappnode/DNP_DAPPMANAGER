import { retryable } from "utils/functions";
import { stringIncludes } from "utils/strings";

// This construction prevents ipfs from auto initialize when imported
// If this happens tests can fail and trigger nasty effects
const host = "my.ipfs.dnp.dappnode.eth";
const port = 5001;
const protocol = "http";
const hash = "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB";
const expectedString = "Hello and Welcome to IPFS!";
const url = `${protocol}://${host}:${port}/api/v0/cat?arg=${hash}`;

const timeout = 3000;

// Utils:

async function fetchWithTimeout(url: string): Promise<any> {
  return Promise.race([
    fetch(url, { method: "POST" }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), timeout)
    )
  ]);
}

/**
 * Attempts to cat a common IPFS hash.
 * @returns
 * - If the cat succeeds, returns { resolves: true }
 * - On error, returns { resolves: false, error: e.message }
 */
export async function checkIpfsConnection(): Promise<{
  resolves: boolean;
  error?: string;
}> {
  try {
    await retryable(async () => {
      try {
        const file = await fetchWithTimeout(url).then(res => res.text());
        if (!stringIncludes(file, expectedString))
          throw Error("Error parsing file");
      } catch (e) {
        e.message = `Error verifying IPFS: ${e.message}`;
        throw e;
      }
    })();
    return { resolves: true };
  } catch (e) {
    return { resolves: false, error: e.message };
  }
}
