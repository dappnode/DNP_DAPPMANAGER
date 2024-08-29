import { logs } from "@dappnode/logger";
import { ipfsTest } from "./ipfsTest.js";

/**
 * Returns boolean depending on whether ipfs resolves
 */
export async function ipfsResolves(): Promise<boolean> {
  try {
    await ipfsTest;
    return true;
  } catch (error) {
    logs.error(`Error thrown while testing ipfs: ${error}`);
  }
  return false;
}
