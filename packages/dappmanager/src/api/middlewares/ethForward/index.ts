import express from "express";
import { getIpfsProxyHandler, ProxyType } from "./ipfsProxy.js";
import { ResolveDomainWithCache } from "./resolveDomain.js";

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
        ethForwardHandler(req, res, domain);
        return;
      }

      next();
    } catch (e) {
      next(e);
    }
  };
}

function parseEthDomainHost(req: express.Request): string | null {
  // Check if a request is for a decentralized website, based on their host
  // - decentral.eth => true
  // - my.dappmanager.dnp.dappnode.eth => false
  // - my.dappnode => false
  const domain = req.headers.host;
  return typeof domain === "string" &&
    domain.endsWith(".eth") &&
    !domain.endsWith("dnp.dappnode.eth")
    ? domain
    : null;
}
