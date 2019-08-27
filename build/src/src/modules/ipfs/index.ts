import * as ipfsParams from "./ipfsParams";
import wrapMethodsWithQueue from "../../utils/wrapMethodsWithQueue";
import isIpfsHash from "../../utils/isIpfsHash";
import { timeoutError } from "./data";

// Methods
import * as methods from "./methods";

// Params
const params = {
  times: ipfsParams.times || 3,
  concurrency: ipfsParams.concurrency || 10,
  intervalBase: ipfsParams.intervalBase || 225
};

/**
 * First, wrap methods with a concurrency and retry async queue.
 * This wrap ensures that many concurrent calls will not overload the
 * node, increasing the chances of failure.
 */
const wrappedMethods = wrapMethodsWithQueue(methods, params);

/**
 * Second, wrap the wrapped methods with a check to verify if the
 * hash is available in the current peers. This availability check
 * is itself wrapped in a retry async flow.
 */

function wrapMethodWithIsAvailable(method: (...args: any[]) => any) {
  return async function(hash: string, ...args: any[]) {
    await isAvailable(hash);
    return await method(hash, ...args);
  };
}

async function isAvailable(hash: string) {
  if (!hash || typeof hash !== "string")
    throw Error(`arg hash must be a string: ${hash}`);
  if (!isIpfsHash(hash)) throw Error(`Invalid IPFS hash: ${hash}`);
  // Reformat the hash, some methods do not tolerate the /ipfs/ prefix
  hash = hash.split("ipfs/")[1] || hash;

  try {
    await wrappedMethods.objectSize(hash);
  } catch (e) {
    if (e.message === timeoutError)
      throw Error(`Ipfs hash not available: ${hash}`);
    else throw Error(`Ipfs hash ${hash} not available error: ${e.message}`);
  }
}

export const cat = wrapMethodWithIsAvailable(wrappedMethods.cat);
export const catStreamToFs = wrapMethodWithIsAvailable(
  wrappedMethods.catStreamToFs
);
