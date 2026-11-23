import type { IncomingHttpHeaders, IncomingMessage } from "http";
import type express from "express";

// CSRF / cross-site WebSocket hijacking protection
// =================================================
// The admin session cookie is `SameSite=Strict`, which stops cross-SITE
// requests but not same-site cross-ORIGIN ones. The admin UI is reachable
// through the HTTPS portal at `https://pwa.<hash>.dyndns.dappnode.io` and
// packages can be exposed at `https://<sub>.<hash>.dyndns.dappnode.io`, which
// is the same site. A package UI there could otherwise make the admin's
// browser send authenticated requests (HTML form POSTs to /rpc, or a
// WebSocket to the Socket.io RPC endpoint).
//
// This guard only accepts state-changing requests that the browser itself
// reports as same-origin. Clients that send neither `Sec-Fetch-Site` nor
// `Origin` (packages, MCP clients, curl) are not browsers acting on behalf of
// a logged-in admin, so they are let through and rely on their own auth.

export const CROSS_ORIGIN_REQUEST_REJECTED = "CROSS_ORIGIN_REQUEST_REJECTED";
export const UNSUPPORTED_CONTENT_TYPE = "UNSUPPORTED_CONTENT_TYPE";

const PROXY_HINT =
  "If you reach the admin UI through your own reverse proxy, configure it to forward the original Host header " +
  "(nginx: `proxy_set_header Host $host;`) and, if it terminates TLS, `X-Forwarded-Proto`";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export type SameOriginCheck = { allowed: true } | { allowed: false; reason: string };

function firstHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/**
 * Scheme the browser used to reach this server. The dappmanager only listens
 * on plain HTTP, unless a proxy terminated TLS: the HTTPS portal forwards
 * keeping the browser's `Host` (`proxy_set_header Host $host`) and adding
 * `X-Forwarded-Proto: https`. Then only an `https:` origin is the same origin.
 */
function getRequestScheme(headers: IncomingHttpHeaders): string {
  const forwardedProto = firstHeader(headers["x-forwarded-proto"])?.split(",")[0]?.trim().toLowerCase();
  return forwardedProto === "https" ? "https:" : "http:";
}

/**
 * Returns true if `origin` is the origin the request was sent to, i.e. its
 * host (including the port, if any) equals the `Host` header.
 */
function isOwnOrigin(origin: string, headers: IncomingHttpHeaders): boolean {
  const host = firstHeader(headers.host)?.trim().toLowerCase();
  if (!host) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }

  return originUrl.host.toLowerCase() === host && originUrl.protocol === getRequestScheme(headers);
}

/**
 * Decide if a browser request comes from the admin UI's own origin.
 *
 * 1. `Origin` in `allowedOrigins` (HTTP_CORS_WHITELIST, e.g. the UI dev server)
 *    is allowed.
 * 2. If the browser sent `Sec-Fetch-Site`, only `same-origin` and `none`
 *    (user-initiated, e.g. typed URL) are allowed. `same-site` and
 *    `cross-site` are rejected.
 * 3. Otherwise (older browsers), if `Origin` is present it must match the
 *    request's own host.
 * 4. Requests with neither header are not from a browser and are allowed.
 */
export function checkSameOrigin(headers: IncomingHttpHeaders, allowedOrigins: readonly string[]): SameOriginCheck {
  const origin = firstHeader(headers.origin);
  if (origin && allowedOrigins.includes(origin)) return { allowed: true };

  const secFetchSite = firstHeader(headers["sec-fetch-site"])?.trim().toLowerCase();
  if (secFetchSite) {
    if (secFetchSite === "same-origin" || secFetchSite === "none") return { allowed: true };
    return { allowed: false, reason: `Sec-Fetch-Site ${secFetchSite}` };
  }

  if (origin) {
    if (isOwnOrigin(origin, headers)) return { allowed: true };
    // Also reached by an admin behind their own reverse proxy if it rewrites `Host`. The server cannot
    // tell that apart from a foreign origin, so say what the proxy must forward instead of guessing
    const receivedAt = `${getRequestScheme(headers)}//${firstHeader(headers.host) ?? ""}`;
    return {
      allowed: false,
      reason: `Origin ${origin} is not ${receivedAt}, where this request was received. ${PROXY_HINT}`
    };
  }

  return { allowed: true };
}

/**
 * Express middleware rejecting cross-origin browser requests to
 * state-changing (non GET/HEAD/OPTIONS) routes with 403.
 */
export function sameOriginGuard(allowedOrigins: readonly string[]): express.RequestHandler {
  return (req, res, next) => {
    if (safeMethods.has(req.method)) return next();

    const check = checkSameOrigin(req.headers, allowedOrigins);
    if (check.allowed) return next();

    res.status(403).send({
      error: { name: CROSS_ORIGIN_REQUEST_REJECTED, message: `Cross-origin request rejected: ${check.reason}` }
    });
  };
}

/**
 * Engine.io answers a polling handshake as JSONP (`___eio[<j>](...)`) if its
 * URL has a `j` query parameter. A `<script src>` can then read the session id
 * from another origin and drive the session with form POSTs. Over plain HTTP
 * that script request has neither `Origin` nor `Sec-Fetch-Site`, exactly like
 * the admin UI's own same-origin polling handshake, so the headers cannot
 * tell them apart. No supported client uses JSONP.
 */
function isJsonpHandshake(req: IncomingMessage): boolean {
  // Engine.io parses the query into `_query` before calling `allowRequest` and picks the transport from it
  const engineQuery = (req as IncomingMessage & { _query?: Record<string, unknown> })._query;
  if (engineQuery) return Object.hasOwn(engineQuery, "j");

  try {
    return new URL(req.url ?? "", "http://localhost").searchParams.has("j");
  } catch {
    return true;
  }
}

/**
 * Socket.io `allowRequest` option. WebSocket handshakes are not subject to
 * CORS, so without this any same-site page could open the RPC socket with
 * the admin's cookie. Engine.io calls it for every new connection handshake,
 * and not again for the requests that follow with the session id.
 */
export function socketIoAllowRequest(
  allowedOrigins: readonly string[]
): (req: IncomingMessage, callback: (err: string | null | undefined, success: boolean) => void) => void {
  return (req, callback) => {
    const check = checkSameOrigin(req.headers, allowedOrigins);
    if (check.allowed && !isJsonpHandshake(req)) callback(null, true);
    else callback(CROSS_ORIGIN_REQUEST_REJECTED, false);
  };
}

/**
 * Only accept `application/json` request bodies. A cross-origin request with
 * a JSON body needs a CORS preflight, which the CORS allow-list rejects, while
 * HTML forms can only send urlencoded, multipart or text/plain bodies.
 * Requests without a body (e.g. DELETE) are allowed.
 */
export const requireJsonBody: express.RequestHandler = (req, res, next) => {
  const contentType = req.headers["content-type"];
  const contentLength = req.headers["content-length"];
  const hasBody =
    req.headers["transfer-encoding"] !== undefined || (contentLength !== undefined && contentLength !== "0");

  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "application/json" || (!mediaType && !hasBody)) return next();

  res.status(415).send({
    error: { name: UNSUPPORTED_CONTENT_TYPE, message: "Request body must be application/json" }
  });
};
