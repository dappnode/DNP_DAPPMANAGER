import http from "http";
import https from "https";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logs } from "@dappnode/logger";
import { isTorAvailable } from "../utils/tor.js";

// Grafana Cloud Faro collector endpoint
const GRAFANA_FARO_URL = new URL(
  "https://faro-collector-prod-eu-west-2.grafana.net/collect/5bd7f97529682b89495b057d48ac27ec"
);

// Tor SOCKS5 proxy (socks5h = DNS resolution through proxy to avoid DNS leaks)
const TOR_SOCKS_PROXY = "socks5h://127.0.0.1:9050";

// UI Metrics proxy port
const UI_METRICS_PORT = 8080;

const ALLOWED_CORS_HOSTS = new Set([
  "my.dappnode",
  "dappmanager.dappnode",
  "dappmanager.dappnode.private",
  "my.dappnode.private"
]);

function getOriginHostname(originHeader: unknown): string | null {
  if (typeof originHeader !== "string" || !originHeader) return null;
  try {
    return new URL(originHeader).hostname;
  } catch {
    return null;
  }
}

function isCorsHeader(headerKey: string): boolean {
  return headerKey.toLowerCase().startsWith("access-control-");
}

// Headers that should not be forwarded (hop-by-hop headers)
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host"
]);

/**
 * Start a dedicated HTTP proxy server for UI metrics.
 * Forwards all requests to Grafana Cloud through Tor for anonymity.
 */
export function startUiMetricsProxy(): http.Server {
  // Create a reusable SOCKS proxy agent for Tor
  const torAgent = new SocksProxyAgent(TOR_SOCKS_PROXY);

  const server = http.createServer(async (req, res) => {
    const startTime = Date.now();

    const origin = req.headers.origin;
    const originHostname = getOriginHostname(origin);
    const isCorsOriginAllowed = originHostname ? ALLOWED_CORS_HOSTS.has(originHostname) : true;

    // If request includes an Origin and it's not allowed, reject early
    if (origin && !isCorsOriginAllowed) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: "CORS origin not allowed" }));
      return;
    }

    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      if (typeof origin === "string" && origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization, X-Requested-With, x-faro-session-id"
        );
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Max-Age", "86400");
      }
      res.statusCode = typeof origin === "string" && origin ? 200 : 403;
      res.end();
      return;
    }

    // Set CORS headers for all responses
    if (typeof origin === "string" && origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, x-faro-session-id"
      );
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
    try {
      // Check if Tor is available
      const torReady = await isTorAvailable();
      if (!torReady) {
        logs.warn("[ui-metrics-proxy] Tor SOCKS proxy not available, dropping request");
        res.statusCode = 503;
        res.end(JSON.stringify({ error: "Tor proxy not available" }));
        return;
      }

      // Collect request body
      const bodyChunks: Buffer[] = [];
      for await (const chunk of req) {
        bodyChunks.push(chunk);
      }
      const body = Buffer.concat(bodyChunks);

      // Build headers to forward (filter out hop-by-hop headers)
      const forwardHeaders: Record<string, string> = {};
      for (const [key, value] of Object.entries(req.headers)) {
        if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && value) {
          forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      }
      // Set the correct host header for the target
      forwardHeaders["host"] = GRAFANA_FARO_URL.host;

      // Forward request to Grafana Cloud through Tor
      const proxyReq = https.request(
        {
          hostname: GRAFANA_FARO_URL.hostname,
          port: 443,
          path: GRAFANA_FARO_URL.pathname,
          method: req.method,
          headers: forwardHeaders,
          agent: torAgent
        },
        (proxyRes) => {
          const duration = Date.now() - startTime;

          // Forward response headers (filter hop-by-hop)
          for (const [key, value] of Object.entries(proxyRes.headers)) {
            // Don't forward upstream CORS headers; we manage CORS ourselves.
            if (isCorsHeader(key)) continue;
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase()) && value) {
              res.setHeader(key, value);
            }
          }

          res.statusCode = proxyRes.statusCode || 502;

          if (proxyRes.statusCode && proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
            logs.info(`[ui-metrics-proxy] ${req.method} forwarded successfully (${duration}ms)`);
          } else {
            logs.warn(
              `[ui-metrics-proxy] ${req.method} returned ${proxyRes.statusCode} (${duration}ms)`
            );
          }

          // Pipe response body
          proxyRes.pipe(res);
        }
      );

      proxyReq.on("error", (err) => {
        const duration = Date.now() - startTime;
        logs.error(`[ui-metrics-proxy] Proxy error: ${err.message} (${duration}ms)`);
        if (!res.headersSent) {
          res.statusCode = 502;
          res.end(JSON.stringify({ error: "Failed to forward request" }));
        }
      });

      // Set timeout for Tor latency
      proxyReq.setTimeout(30000, () => {
        proxyReq.destroy();
        if (!res.headersSent) {
          res.statusCode = 504;
          res.end(JSON.stringify({ error: "Request timeout" }));
        }
      });

      // Send request body
      if (body.length > 0) {
        proxyReq.write(body);
      }
      proxyReq.end();
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logs.error(`[ui-metrics-proxy] Error: ${errorMessage} (${duration}ms)`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal server error" }));
      }
    }
  });

  server.listen(UI_METRICS_PORT, () => {
    logs.info(`UI Metrics Proxy listening on port ${UI_METRICS_PORT} (forwarding to Grafana Cloud via Tor)`);
  });

  return server;
}
