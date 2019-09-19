import * as ipfsParams from "./ipfsParams";
import { runWithRetry } from "../../utils/asyncFlows";
import isIpfsHash from "../../utils/isIpfsHash";
import { timeoutError, IpfsArgument } from "./data";

// Methods
import catRaw from "./methods/cat";
import catStreamToFsRaw from "./methods/catStreamToFs";
import objectSizeRaw from "./methods/objectSize";

// Params
const params = {
  times: ipfsParams.times || 3,
  concurrency: ipfsParams.concurrency || 10,
  intervalBase: ipfsParams.intervalBase || 225
};

async function isAvailable(hash: string): Promise<void> {
  if (!isIpfsHash(hash)) throw Error(`Invalid IPFS hash: ${hash}`);
  // Reformat the hash, some methods do not tolerate the /ipfs/ prefix
  hash = hash.split("ipfs/")[1] || hash;

  await objectSizeRaw(hash).catch(e => {
    if (e.message === timeoutError)
      throw Error(`Ipfs hash not available: ${hash}`);
    else throw Error(`Ipfs hash ${hash} not available error: ${e.message}`);
  });
}

/**
 * Second, wrap the wrapped methods with a check to verify if the
 * hash is available in the current peers. This availability check
 * is itself wrapped in a retry async flow.
 */

function wrapMethodWithIsAvailableAndRetry<A extends IpfsArgument, R>(
  method: (kwargs: A) => Promise<R>
): (kwargs: A) => Promise<R> {
  const isAvailableRetry = runWithRetry(isAvailable, params);
  const methodRetry = runWithRetry(method, params);
  return async function(kwargs: A): Promise<R> {
    await isAvailableRetry(kwargs.hash);
    return await methodRetry(kwargs);
  };
}

export const cat = wrapMethodWithIsAvailableAndRetry(catRaw);
export const catStreamToFs = wrapMethodWithIsAvailableAndRetry(
  catStreamToFsRaw
);
