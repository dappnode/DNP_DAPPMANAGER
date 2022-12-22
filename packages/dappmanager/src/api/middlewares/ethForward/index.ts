import express from "express";
import params from "../../../params";
import { getIpfsProxyHandler, ProxyType } from "./ipfsProxy";
import { ResolveDomainWithCache } from "./resolveDomain";

export function getEthForwardMiddleware(): express.RequestHandler {
  // Create a domain resolver with cache
  const resolveDomain = ResolveDomainWithCache();
  // Start ethforward http proxy: Resolves .eth domains
  const ethForwardHandler = getIpfsProxyHandler<string>(
    ProxyType.ETHFORWARD,
    async (_req, domain) => await resolveDomain(domain)
  );

  // Start IPFS gateway proxy: Serve IPFS content from the DAPPMANAGER
  const ipfsGatewayProxydHandler = getIpfsProxyHandler<string>(
    ProxyType.IPFS_GATEWAY,
    async (_req, hash) => ({ location: "ipfs", hash })
  );

  return (req, res, next): void => {
    try {
      const domain = parseEthDomainHost(req);
      if (domain !== null) {
        ethForwardHandler(req, res, domain);
        return;
      }

      const hash = parseIpfsGatewayProxyReqHash(req.url);
      if (hash !== null) {
        ipfsGatewayProxydHandler(req, res, hash);
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

/**
 * @param reqUrl Must be the parsed path, i.e. `/ipfs-gateway-proxy/Qm`
 */
export function parseIpfsGatewayProxyReqHash(reqUrl: string): string | null {
  // Check if this request is for the IFPS gateway proxy,
  // - my.dappnode/ipfs-gateway-proxy/Qm -> true
  // - my.dappnode -> false
  // - decentral.eth -> false
  if (typeof reqUrl !== "string") return null;

  let pathname = reqUrl;
  if (!pathname.startsWith("/")) pathname = "/" + pathname;
  if (pathname.startsWith(params.IPFS_GATEWAY)) {
    return pathname.slice(params.IPFS_GATEWAY.length);
  } else {
    return null;
  }
}
