import retry from "async-retry";
import { ipfs } from "@dappnode/ipfs";

/** Well-known hash that should always be available */
const hash = "QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB";
const expectedString = "Hello and Welcome to IPFS!";

/**
 * Attempts to cat a common IPFS hash. resolves if all OK, throws otherwise
 */
export async function ipfsTest(): Promise<void> {
  await retry(
    async () => {
      try {
        const file = await ipfs.writeFileToMemory(hash);
        if (!file.includes(expectedString))
          throw Error("Resolved file does not include expected string");
      } catch (e) {
        e.message = `Error verifying IPFS: ${e.message}`;
        throw e;
      }
    },
    { retries: 3 }
  );
}
