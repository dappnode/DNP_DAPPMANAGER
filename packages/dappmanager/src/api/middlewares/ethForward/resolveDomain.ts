import { ethers } from "ethers";
import resolverAbi from "./abi/resolverAbi.json" with { type: "json" };
import ensAbi from "./abi/ens.json" with { type: "json" };
import { Content, NotFoundError, EnsResolverError } from "./types.js";
import { decodeContentHash, isEmpty, decodeDnsLink, decodeContent } from "./utils/index.js";
import memoize from "memoizee";

const domainsCacheMs = 5 * 60 * 1000;

/**
 * ENS parameters
 * Last updated March 2020
 */
const ensAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
export const mainnetJsonRpc = "http://execution.mainnet.dncore.dappnode:8545";

const CONTENTHASH_INTERFACE_ID = "0xbc1c58d1";
const TEXT_INTERFACE_ID = "0x59d1d43c";
const CONTENT_INTERFACE_ID = "0xd8389dc5";
const interfaces = [CONTENTHASH_INTERFACE_ID, TEXT_INTERFACE_ID, CONTENT_INTERFACE_ID];

interface InterfacesAvailable {
  [interfaceHash: string]: boolean;
}

/**
 * Caches obtaining and validating an eth client
 * Caches the domains by domain and provider instance
 */
export function ResolveDomainWithCache(): (domain: string) => Promise<Content> {
  const _resolveDomain = memoize(resolveDomain, {
    promise: true,
    maxAge: domainsCacheMs
  });
  return async function (domain: string): Promise<Content> {
    const provider = new ethers.JsonRpcProvider(mainnetJsonRpc); // TODO: review
    return _resolveDomain(domain, provider);
  };
}

/**
 * Resolves a request for an ENS domain iterating over various methods
 * - `.eth` domains: Resolve with mainnet
 * - else: throw Error
 * @param domain
 * @returns content object
 */
export async function resolveDomain(domain: string, provider: ethers.Provider): Promise<Content> {
  const node = ethers.namehash(domain);
  const ens = new ethers.Contract(ensAddress, ensAbi, provider);
  const resolverAddress = await ens.resolver(node);
  if (parseInt(resolverAddress) === 0) throw new EnsResolverError("resolver not found", { domain });

  const resolver = new ethers.Contract(resolverAddress, resolverAbi, provider);
  const interfacesAvailable = await getInterfacesAvailable(resolver);

  // `contentHash` Main method
  if (interfacesAvailable[CONTENTHASH_INTERFACE_ID]) {
    const res: string = await resolver.contenthash(node);
    if (!isEmpty(res)) return decodeContentHash(res);
  }

  // `text` Deprecated but it preserved for compatibility
  if (interfacesAvailable[TEXT_INTERFACE_ID]) {
    const res: string = await resolver.text(node, "dnslink");
    if (!isEmpty(res)) return decodeDnsLink(res);
  }

  // `content` Legacy
  if (interfacesAvailable[CONTENT_INTERFACE_ID]) {
    const res: string = await resolver.content(node);
    if (!isEmpty(res)) return decodeContent(res);
  }

  throw new NotFoundError("content not configured", { domain });
}

// Utils

/**
 * Iterates over various interfaces to check if they are available
 *
 * @param resolver ethjs contract instance
 * @returns interfacesAvailable = {
 *   "0xbc1c58d1": false,
 *   [TEXT_INTERFACE_ID]: true,
 * }
 */
async function getInterfacesAvailable(resolver: ethers.Contract): Promise<InterfacesAvailable> {
  const iAvail: InterfacesAvailable = {};
  await Promise.all(
    interfaces.map(async (iHash) => {
      iAvail[iHash] = await resolver.supportsInterface(iHash);
    })
  );
  return iAvail;
}
