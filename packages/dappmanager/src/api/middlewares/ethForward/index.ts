import express from "express";
import { params } from "@dappnode/params";
import { ethers } from "ethers";
import { create as createIpfsClient } from "kubo-rpc-client";
import { getIpfsProxyHandler, ProxyType } from "./ipfsProxy.js";
import { mainnetJsonRpc, ResolveDomainWithCache } from "./resolveDomain.js";
import { logs } from "@dappnode/logger";
import * as views from "./views/index.js";
import { NodeNotAvailable } from "./types.js";

const ETH_API_URL = mainnetJsonRpc;
const IPFS_API_URL = getIpfsApiUrl();
const APIS_CHECK_TIMEOUT_MS = 3_000;
const APIS_CHECK_CACHE_MS = 10_000;

type ApisAvailability = {
  isEthAvailable: boolean;
  isIpfsAvailable: boolean;
};

let apisAvailabilityCache:
  | {
      value: ApisAvailability;
      timestamp: number;
    }
  | undefined;

export function getEthForwardMiddleware(): express.RequestHandler {
  // Create a domain resolver with cache
  const resolveDomain = ResolveDomainWithCache();
  // Start ethforward http proxy: Resolves .eth domains
  const ethForwardHandler = getIpfsProxyHandler<{ domain: string; isIpfsAvailable: boolean }>(
    ProxyType.ETHFORWARD,
    async (_req, { domain, isIpfsAvailable }) => {
      const content = await resolveDomain(domain);
      if (content.location === "ipfs" && !isIpfsAvailable) {
        throw new NodeNotAvailable(`IPFS API ${IPFS_API_URL} is unavailable`, "ipfs");
      }
      return content;
    }
  );

  return (req, res, next): void => {
    try {
      const domain = parseEthDomainHost(req);
      if (domain !== null) {
        ensureApisAvailability()
          .then((apisAvailability) => {
            if (!apisAvailability.isEthAvailable) {
              logs.warn(
                `ETHFORWARD blocked ${domain}: ETH API up=${apisAvailability.isEthAvailable}, IPFS API up=${apisAvailability.isIpfsAvailable}`
              );

              res.writeHead(200, { "Content-Type": "text/html" });
              if (!apisAvailability.isIpfsAvailable) {
                res.write(
                  views.noEthAndIpfs(
                    new Error(`Ethereum API ${ETH_API_URL} and IPFS API ${IPFS_API_URL} are unavailable`)
                  )
                );
              } else {
                res.write(views.noEth(new Error(`Ethereum API ${ETH_API_URL} is unavailable`)));
              }
              res.end();
              return;
            }

            return ethForwardHandler(req, res, { domain, isIpfsAvailable: apisAvailability.isIpfsAvailable });
          })
          .catch(next);
        return;
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}

async function ensureApisAvailability(): Promise<ApisAvailability> {
  const now = Date.now();

  if (apisAvailabilityCache && now - apisAvailabilityCache.timestamp < APIS_CHECK_CACHE_MS) {
    return apisAvailabilityCache.value;
  }

  const [isEthAvailable, isIpfsAvailable] = await Promise.all([isEthApiAvailable(), isIpfsApiAvailable()]);
  const value = { isEthAvailable, isIpfsAvailable };
  apisAvailabilityCache = { value, timestamp: now };

  return value;
}

async function isEthApiAvailable(): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(ETH_API_URL);
  try {
    await withTimeout(provider.send("web3_clientVersion", []), APIS_CHECK_TIMEOUT_MS);
    return true;
  } catch (e) {
    logs.debug("ETHFORWARD ETH API check failed", e);
    return false;
  } finally {
    provider.destroy();
  }
}

async function isIpfsApiAvailable(): Promise<boolean> {
  if (!IPFS_API_URL) return false;

  try {
    const ipfsClient = createIpfsClient({
      url: IPFS_API_URL,
      timeout: APIS_CHECK_TIMEOUT_MS
    });

    await withTimeout(ipfsClient.id(), APIS_CHECK_TIMEOUT_MS);
    return true;
  } catch (e) {
    logs.debug("ETHFORWARD IPFS API check failed", e);
    return false;
  }
}

function getIpfsApiUrl(): string {
  try {
    const url = new URL(params.ETHFORWARD_IPFS_REDIRECT);
    url.port = "5001";
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch (e) {
    logs.warn("ETHFORWARD Invalid IPFS URL for API check", e);
    return "";
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutHandle!);
  }
}

function parseEthDomainHost(req: express.Request): string | null {
  // Check if a request is for a decentralized website, based on their host
  // - decentral.eth => true
  // - my.dappmanager.dnp.dappnode.eth => false
  // - my.dappnode => false
  const domain = req.headers.host;
  return typeof domain === "string" && domain.endsWith(".eth") && !domain.endsWith("dnp.dappnode.eth") ? domain : null;
}
