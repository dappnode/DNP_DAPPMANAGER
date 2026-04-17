import express from "express";
import { params } from "@dappnode/params";
import { getIpfsProxyHandler, ProxyType } from "./ipfsProxy.js";
import { mainnetJsonRpc, ResolveDomainWithCache } from "./resolveDomain.js";
import { logs } from "@dappnode/logger";
import * as views from "./views/index.js";

const ETH_API_URL = mainnetJsonRpc;
const IPFS_API_URL = params.IPFS_HOST ? new URL("/api/v0/id", params.IPFS_HOST).toString() : "";
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
    const response = await fetchWithTimeout(ETH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "web3_clientVersion",
        params: [],
        id: 1
      })
    });

    return response.ok;
  } catch (e) {
    logs.debug("ETHFORWARD ETH API check failed", e);
    return false;
  }
}

async function isIpfsApiAvailable(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(IPFS_API_URL, {
      method: "POST"
    });

    return response.ok;
  } catch (e) {
    logs.debug("ETHFORWARD IPFS API check failed", e);
    return false;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), APIS_CHECK_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
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
