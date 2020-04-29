import http from "http";
import httpProxy from "http-proxy";
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
import Logs from "../logs";
const logs = Logs(module);

// Define params

const ipfsRedirect = params.ETHFORWARD_IPFS_REDIRECT; // "http://ipfs.dappnode:8080"
const swarmRedirect = params.ETHFORWARD_SWARM_REDIRECT; // "http://swarm.dappnode";
const pinContentOnVisit = params.ETHFORWARD_PIN_ON_VISIT;
const port = params.ETHFORWARD_HTTP_PROXY_PORT;

/**
 * Convert a decentralized content into a fetchable URL
 * @param content
 */
function getTargetUrl(content: Content): string {
  switch (content.location) {
    case "ipfs":
      return urlJoin(ipfsRedirect, content.hash);
    case "swarm":
      return urlJoin(swarmRedirect, content.hash);
  }
}

/**
 * Start eth forward http proxy
 */
export default function startEthForward(): void {
  // Create a proxy
  const proxy = httpProxy.createProxyServer({});

  // Create a domain resolver with cache
  const resolveDomain = ResolveDomainWithCache();

  async function proxyHttpServerHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const domain = req.headers.host;
    try {
      if (!domain) throw new TypeError(`req host is not defined`);

      const content = await resolveDomain(domain);
      const target = getTargetUrl(content);
      logs.debug(`Proxying ${domain} to ${target}`, content);

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

      if (content.location === "ipfs" && pinContentOnVisit)
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
        logs.error(`ETHFORWARD Unknown error resolving ${domain}: ${e.stack}`);
        return views.unknownError(e);
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(errorToResponseHtml(e, domain));
      res.end();
    }
  }

  // Log status
  logs.info(`IPFS redirect set to: ${ipfsRedirect}`);
  logs.info(`SWARM redirect set to: ${swarmRedirect}`);
  logs.info(`Http server listening at port: ${port}`);

  // Generic callback for errors
  proxy.on("error", e => {
    console.log(e);
    logs.error(`ETHFORWARD proxy error: ${e.message}`);
  });

  // Create an HTTP server and register its handler
  http.createServer(proxyHttpServerHandler).listen(port);
}
