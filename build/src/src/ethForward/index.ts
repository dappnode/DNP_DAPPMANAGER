import path from "path";
import http from "http";
import util from "util";
import httpProxy from "http-proxy";
import params from "../params";
import { ResolveDomainWithCache } from "./resolveDomain";
import {
  NodeNotAvailable,
  ProxyError,
  EnsResolverError,
  NotFoundError
} from "./types";
import { pinIpfsHash } from "./utils";
import * as views from "./views";
import Logs from "../logs";
import { EthProviderError } from "../modules/ethClient";
const logs = Logs(module);

// Define params

const ipfsRedirect = params.ETHFORWARD_IPFS_REDIRECT; // "http://ipfs.dappnode:8080"
const swarmRedirect = params.ETHFORWARD_SWARM_REDIRECT; // "http://swarm.dappnode";
const pinContentOnVisit = params.ETHFORWARD_PIN_ON_VISIT;
const port = params.ETHFORWARD_HTTP_PROXY_PORT;

/**
 * Start eth forward http proxy
 */
export default function startEthForward(): void {
  // Create a proxy
  const proxy = httpProxy.createProxyServer({});
  const proxyWeb = util.promisify(proxy.web);

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
      logs.debug(`Resolved ${domain} to ${JSON.stringify(content)}`);

      // Alias to isolate proxying logic from the location switch
      const proxyTo = (target: string): Promise<http.IncomingMessage> =>
        proxyWeb(req, res, { target }).catch(e => {
          if (e.message.includes("EHOSTUNREACH"))
            throw new NodeNotAvailable(e.message, content.location);
          throw new ProxyError(e.message, target);
        });

      switch (content.location) {
        case "ipfs":
          await proxyTo(path.join(ipfsRedirect, content.hash));
          if (pinContentOnVisit)
            pinIpfsHash(content.hash).catch(e =>
              logs.debug(`Error pinning ${content.hash}: ${e.message}`)
            );

        case "swarm":
          await proxyTo(path.join(swarmRedirect, content.hash));
      }
    } catch (e) {
      function send(html: string): void {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(html);
        res.end();
      }

      logs.debug(`ETHFORWARD Error: ${e.message}`);

      // Not found views
      if (e instanceof EnsResolverError || e instanceof NotFoundError)
        return send(views.notFound(e));

      // Node not available views
      if (e instanceof EthProviderError) return send(views.noEth(e));
      if (e instanceof NodeNotAvailable)
        if (e.location === "swarm") return send(views.noSwarm(e));
        else if (e.location === "ipfs") return send(views.noIpfs(e));

      // Unknown errors, log to error
      logs.error(`ETHFORWARD Unknown error resolving ${domain}: ${e.stack}`);

      // Proxy errors
      if (e instanceof ProxyError) send(views.unknownError(e));

      return send(views.unknownError(e));
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
