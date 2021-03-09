import http from "http";
import httpProxy from "http-proxy";
import express from "express";
import params from "../params";
import { EthProviderError } from "../modules/ethClient";
import { pinAddNoThrow } from "../modules/ipfs/methods/pinAdd";
import { urlJoin } from "../utils/url";
import { ResolveDomainWithCache } from "./resolveDomain";
import * as views from "./views";
import {
  NodeNotAvailable,
  ProxyError,
  EnsResolverError,
  NotFoundError,
  Content
} from "./types";
import { logs } from "../logs";

export function getEthForwardMiddleware(): express.RequestHandler {
  const ethForwardHandler = getEthForwardHandler();
  return (req, res, next): void => {
    if (isDwebRequest(req)) ethForwardHandler(req, res);
    else next();
  };
}

/**
 * Convert a decentralized content into a fetchable URL
 * @param content
 */
function getTargetUrl(content: Content): string {
  switch (content.location) {
    case "ipfs":
      return urlJoin(params.ETHFORWARD_IPFS_REDIRECT, content.hash);
    case "swarm":
      return urlJoin(params.ETHFORWARD_SWARM_REDIRECT, content.hash);
  }
}

/**
 * Check if a request is for a decentralized website, based on their host
 * - decentral.eth => true
 * - my.dappmanager.dnp.dappnode.eth => false
 * - my.dappnode => false
 */
function isDwebRequest(req: http.IncomingMessage): boolean {
  const domain = req.headers.host;
  return (
    typeof domain === "string" &&
    domain.endsWith(".eth") &&
    !domain.endsWith("dnp.dappnode.eth")
  );
}

/**
 * Start eth forward http proxy
 */
function getEthForwardHandler(): (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => Promise<void> {
  logs.info(`IPFS redirect set to: ${params.ETHFORWARD_IPFS_REDIRECT}`);
  logs.info(`SWARM redirect set to: ${params.ETHFORWARD_SWARM_REDIRECT}`);

  const proxy = httpProxy.createProxyServer({});
  proxy.on("error", e => {
    logs.error(`ETHFORWARD proxy error`, e);
  });

  // Create a domain resolver with cache
  const resolveDomain = ResolveDomainWithCache();

  return async function ethForwardProxyHttpHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const domain = req.headers.host;
    try {
      if (!domain) throw new TypeError(`req host is not defined`);

      const content = await resolveDomain(domain);
      const target = getTargetUrl(content);
      logs.debug(`Proxying ${domain} to ${target}`, content);

      // Must change the host from something not *.eth, to prevent the IPFS node
      // from trying to resolve the domain with DNSLink and causing an error
      req.headers.host = "dappmanager.dappnode";

      // Note: Must use the promise constructor otherwise proxy.web breaks
      // due to no proper binding of its underlying 'this'
      //   Cannot read property 'length' of undefined
      //   src/node_modules/http-proxy/lib/http-proxy/index.js:72:31
      await new Promise<http.IncomingMessage>((resolve, reject) => {
        proxy.web(req, res, { target }, (e: Error | undefined, proxyRes) => {
          if (!e) return resolve(proxyRes);
          // Indicates that the host is unreachable.
          // Usually happens when the node is not running
          if (e.message.includes("EHOSTUNREACH"))
            reject(new NodeNotAvailable(e.message, content.location));
          else reject(new ProxyError(e.message, target));
        });
      });

      if (content.location === "ipfs" && params.ETHFORWARD_PIN_ON_VISIT)
        pinAddNoThrow({ hash: content.hash });
    } catch (e) {
      /**
       * Returns the response error HTML. Use function format to make sure
       * a single HTML is returned to the res stream
       */
      function errorToResponseHtml(e: Error, domain?: string): string {
        logs.debug(`ETHFORWARD Error: ${e.message}`);

        // Not found views
        if (e instanceof EnsResolverError || e instanceof NotFoundError)
          return views.notFound(e);

        // Node not available views
        if (e instanceof EthProviderError) return views.noEth(e);
        if (e instanceof NodeNotAvailable)
          if (e.location === "swarm") return views.noSwarm(e);
          else if (e.location === "ipfs") return views.noIpfs(e);

        // Proxy errors
        if (e instanceof ProxyError) return views.unknownError(e);

        // Unknown errors, log to error
        logs.error(`ETHFORWARD Unknown error resolving ${domain}`, e);
        return views.unknownError(e);
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(errorToResponseHtml(e, domain));
      res.end();
    }
  };
}
