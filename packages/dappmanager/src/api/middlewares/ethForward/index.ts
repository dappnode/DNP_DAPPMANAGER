import express from "express";
import { params } from "@dappnode/params";
import { ethers } from "ethers";
import { create as createIpfsClient } from "kubo-rpc-client";
import { getIpfsProxyHandler, ProxyType } from "./ipfsProxy.js";
import { mainnetJsonRpc, ResolveDomainWithCache } from "./resolveDomain.js";
import { logs } from "@dappnode/logger";
import * as views from "./views/index.js";

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
  const ethForwardHandler = getIpfsProxyHandler<string>(
    ProxyType.ETHFORWARD,
    async (_req, domain) => await resolveDomain(domain)
  );

  return (req, res, next): void => {
    try {
      const domain = parseEthDomainHost(req);
      if (domain !== null) {
        ensureApisAvailability()
          .then((apisAvailability) => {
            if (!apisAvailability.isEthAvailable || !apisAvailability.isIpfsAvailable) {
              logs.warn(
                `ETHFORWARD blocked ${domain}: ETH API up=${apisAvailability.isEthAvailable}, IPFS API up=${apisAvailability.isIpfsAvailable}`
              );

              res.writeHead(200, { "Content-Type": "text/html" });
              if (!apisAvailability.isEthAvailable && !apisAvailability.isIpfsAvailable) {
                res.write(
                  views.noEthAndIpfs(
                    new Error(`Ethereum API ${ETH_API_URL} and IPFS API ${IPFS_API_URL} are unavailable`)
                  )
                );
              } else if (!apisAvailability.isEthAvailable) {
                res.write(views.noEth(new Error(`Ethereum API ${ETH_API_URL} is unavailable`)));
              } else {
                res.write(views.noIpfs(new Error(`IPFS API ${IPFS_API_URL} is unavailable`)));
              }
              res.end();
              return;
            }

            ethForwardHandler(req, res, domain);
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
  try {
    const provider = new ethers.JsonRpcProvider(ETH_API_URL);
    await withTimeout(provider.send("web3_clientVersion", []), APIS_CHECK_TIMEOUT_MS);
    return true;
  } catch (e) {
    logs.debug("ETHFORWARD ETH API check failed", e);
    return false;
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
    const ipfsUrl = params.IPFS_HOST || params.IPFS_LOCAL;
    const url = new URL(ipfsUrl);
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
