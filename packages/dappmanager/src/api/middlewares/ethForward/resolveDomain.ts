import { ethers } from "ethers";
import { getEthProviderUrl } from "../../../modules/ethClient";
import resolverAbi from "./abi/resolverAbi.json" assert { type: "json" };
import ensAbi from "./abi/ens.json" assert { type: "json" };
import { Network, Content, NotFoundError, EnsResolverError } from "./types";
import {
  decodeContentHash,
  isEmpty,
  decodeDnsLink,
  decodeContent
} from "./utils";
import memoize from "memoizee";

const providerUrlCacheMs = 60 * 1000;
const domainsCacheMs = 5 * 60 * 1000;

/**
 * ENS parameters
 * Last updated March 2020
 */
const ensAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ropstenJsonRpc = "http://ropsten.dappnode:8545";

const CONTENTHASH_INTERFACE_ID = "0xbc1c58d1";
const TEXT_INTERFACE_ID = "0x59d1d43c";
const CONTENT_INTERFACE_ID = "0xd8389dc5";
const interfaces = [
  CONTENTHASH_INTERFACE_ID,
  TEXT_INTERFACE_ID,
  CONTENT_INTERFACE_ID
];

interface InterfacesAvailable {
  [interfaceHash: string]: boolean;
}

async function getEthersProviderByNetwork(network: Network): Promise<string> {
  switch (network) {
    case "mainnet":
      return await getEthProviderUrl();
    case "ropsten":
      return ropstenJsonRpc;
    default:
      throw Error(`Unsupported network: ${network}`);
  }
}

/**
 * Caches obtaining and validating an eth client
 * Caches the domains by domain and provider instance
 */
export function ResolveDomainWithCache(): (domain: string) => Promise<Content> {
  const _getEthersProviderByNetwork = memoize(getEthersProviderByNetwork, {
    promise: true,
    maxAge: providerUrlCacheMs
  });
  const _resolveDomain = memoize(resolveDomain, {
    promise: true,
    maxAge: domainsCacheMs
  });
  return async function (domain: string): Promise<Content> {
    const network = parseNetworkFromDomain(domain);
    const providerUrl = await _getEthersProviderByNetwork(network);
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    return _resolveDomain(domain, provider);
  };
}

/**
 * Resolves a request for an ENS domain iterating over various methods
 * - `.eth` domains: Resolve with mainnet
 * - `.test` domains: Resolve with ropsten
 * - If NETOFF error, return no-ropsten.html
 * - else: throw Error
 * @param domain
 * @returns content object
 */
export async function resolveDomain(
  domain: string,
  provider: ethers.providers.Provider
): Promise<Content> {
  const node = ethers.utils.namehash(domain);
  const ens = new ethers.Contract(ensAddress, ensAbi, provider);
  const resolverAddress = await ens.resolver(node);
  if (parseInt(resolverAddress) === 0)
    throw new EnsResolverError("resolver not found", { domain });

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

/**
 * Returns the network to fetch from given an ENS domain
 * @param domain "name.eth" | "name.test"
 */
function parseNetworkFromDomain(domain: string): Network {
  if (!domain.includes(".")) throw Error(`domain does not have an TDL`);
  const parts = domain.split(".");
  const extension = parts[parts.length - 1];
  switch (extension) {
    case "eth":
      return "mainnet";
    case "test":
      return "ropsten";
    default:
      throw Error(`TDL not supported ${extension}`);
  }
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
async function getInterfacesAvailable(
  resolver: ethers.Contract
): Promise<InterfacesAvailable> {
  const iAvail: InterfacesAvailable = {};
  await Promise.all(
    interfaces.map(async iHash => {
      iAvail[iHash] = await resolver.supportsInterface(iHash);
    })
  );
  return iAvail;
}
