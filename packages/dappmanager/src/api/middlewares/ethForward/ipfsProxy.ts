import http from "http";
import httpProxy from "http-proxy";
import express from "express";
import params from "../../../params";
import { EthProviderError } from "../../../modules/ethClient";
import { ipfs } from "../../../modules/ipfs";
import { urlJoin } from "../../../utils/url";
import { logs } from "../../../logs";
import * as views from "./views";
import {
  NodeNotAvailable,
  ProxyError,
  EnsResolverError,
  NotFoundError,
  Content
} from "./types";

export enum ProxyType {
  ETHFORWARD = "ETHFORWARD",
  IPFS_GATEWAY = "IPFS_GATEWAY"
}

/**
 * Generalized proxy constructor for both ETHFORWARD and IPFS gateway proxy
 */
export function getIpfsProxyHandler<T>(
  proxyType: ProxyType,
  getContent: (req: express.Request, data: T) => Promise<Content>
): (req: express.Request, res: express.Response, data: T) => Promise<void> {
  const proxy = httpProxy.createProxyServer({});
  proxy.on("error", e => {
    logs.error(`${proxyType} proxy error`, e);
  });

  logs.info(
    `Starting ${proxyType} proxy: IPFS -> ${params.ETHFORWARD_IPFS_REDIRECT} SWARM -> ${params.ETHFORWARD_SWARM_REDIRECT}`
  );

  return async function ethForwardProxyHttpHandler(
    req,
    res,
    data
  ): Promise<void> {
    try {
      const content = await getContent(req, data);
      const target = getTargetUrl(proxyType, content);
      logs.debug(`${proxyType} proxying ${req.url} to ${target}`, content);

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
        ipfs.pinAddNoThrow(content.hash);
    } catch (e) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(errorToResponseHtml(e, req.url));
      res.end();
    }
  };
}

/**
 * Given the proxy type and content return a target URL for proxying
 *
 * - ETHFORWARD: A decentralized site `decentral.eth/image.png` has to be converted
 *   to `ipfs.dappnode:8080/Qm1234/image.png`. We want to append the path to the new
 *   URL which includes the hash of the content
 *
 * - IPFS_GATEWAY: A request to `my.dappnode/ipfs/Qm1234/image.png` to be converted
 *   to `ipfs.dappnode:8080/Qm1234/image.png`. We only need to proxy to a new hostname
 *   the hash and path information is already present in the request
 */
function getTargetUrl(proxyType: ProxyType, content: Content): string {
  switch (proxyType) {
    case ProxyType.ETHFORWARD:
      switch (content.location) {
        case "ipfs":
          return urlJoin(params.ETHFORWARD_IPFS_REDIRECT, "ipfs", content.hash);
        case "swarm":
          return urlJoin(params.ETHFORWARD_SWARM_REDIRECT, content.hash);
      }

    case ProxyType.IPFS_GATEWAY:
      switch (content.location) {
        case "ipfs":
          return params.ETHFORWARD_IPFS_REDIRECT;
        case "swarm":
          return params.ETHFORWARD_SWARM_REDIRECT;
      }
  }
}

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
