import http from "http";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import { helmetConf } from "./helmet.js";
import cors from "cors";
import { Server } from "socket.io";
import path from "path";
import { toSocketIoHandler, wrapHandler } from "./utils.js";
import { AuthPasswordSession, AuthPasswordSessionParams, parseMcpBearerToken } from "./auth/index.js";
import { AdminPasswordDb } from "./auth/adminPasswordDb.js";
import { ClientSideCookies, ClientSideCookiesParams } from "./sessions/index.js";
import { mapSubscriptionsToEventBus } from "./subscriptions.js";
import { Logs } from "@dappnode/logger";
import { EventBus } from "@dappnode/eventbus";
import { subscriptionsFactory } from "@dappnode/common";
import { RpcPayload, RpcResponse, LoggerMiddleware, Routes } from "@dappnode/types";
import { getRpcHandler } from "./handler/index.js";
import {
  nexusChatCompletions,
  nexusChatConfirm,
  nexusChatHistoryClear,
  nexusChatHistoryDelete,
  nexusChatHistoryGet,
  nexusChatHistoryList,
  nexusChatHistoryUpsert,
  nexusClearApiKey,
  nexusListModels,
  nexusLogin,
  nexusProbePrivateMode,
  nexusSetApiKey,
  nexusSetPrivateMode,
  nexusStatus
} from "./routes/nexus.js";
import { handleMcpRequest } from "../mcp/server.js";
import { MCP_UPLOAD_CHUNK_BASE64_CHARS } from "../mcp/upload.js";
import { params as dappnodeParams } from "@dappnode/params";
import { ensureTempTransferDir } from "../uploads/tempTransfer.js";
import { parseHttpUploadFile, reserveHttpUploadCapacity } from "../uploads/httpUploadGuard.js";
import { createIpfsAvatarHandler, GetIpfsFileBytes } from "./avatar.js";
import { requireJsonBody, sameOriginGuard, socketIoAllowRequest } from "./sameOrigin.js";
import { getAuthLimiter, getNexusAuthLimiter } from "./middlewares/requestLimit/index.js";

export interface HttpApiParams extends ClientSideCookiesParams, AuthPasswordSessionParams {
  AUTH_IP_ALLOW_LOCAL_IP: boolean;
  HTTP_API_PORT: number | string;
  UI_FILES_PATH: string;
  HTTP_CORS_WHITELIST: string[];
}

export interface HttpRoutes {
  containerLogs: RequestHandler<{ containerName: string }>;
  dataSend: RequestHandler;
  download: RequestHandler<{ fileId: string }>;
  downloadUserActionLogs: RequestHandler;
  downloadWireguardConfig: RequestHandler<{ device: string }>;
  env: RequestHandler<{ dnpName: string; envName: string }>;
  fileDownload: RequestHandler<{ containerName: string }>;
  fullBackupCreate: RequestHandler;
  fullBackupInspect: RequestHandler;
  fullBackupPendingDownload: RequestHandler<{ fileName: string }>;
  fullBackupRestore: RequestHandler;
  globalEnvs: RequestHandler<{ name: string }>;
  packageManifest: RequestHandler<{ dnpName: string }>;
  metrics: RequestHandler;
  publicPackagesData: RequestHandler<{ containerName: string }>;
  sign: RequestHandler;
  upload: RequestHandler;
}

/**
 * HTTP API
 *
 * [NOTE] This API is not secure
 * - It can't use HTTPS for the limitations with internal IPs certificates
 *
 * [NOTE] To enable express debugging set ENV DEBUG=express:*
 */
export function startHttpApi({
  params,
  logs,
  routes,
  limiterMiddleware,
  counterViewsMiddleware,
  ethForwardMiddleware,
  routesLogger,
  methods,
  subscriptionsLogger,
  adminPasswordDb,
  eventBus,
  isNewDappmanagerVersion,
  getIpfsFileBytes
}: {
  params: HttpApiParams;
  logs: Logs;
  routes: HttpRoutes;
  limiterMiddleware: express.RequestHandler;
  counterViewsMiddleware: express.RequestHandler;
  ethForwardMiddleware: express.RequestHandler;
  routesLogger: LoggerMiddleware;
  methods: Routes;
  subscriptionsLogger: LoggerMiddleware;
  adminPasswordDb: AdminPasswordDb;
  eventBus: EventBus;
  isNewDappmanagerVersion: () => boolean;
  getIpfsFileBytes: GetIpfsFileBytes;
}): http.Server {
  const app = express();
  const server = new http.Server(app);
  const io = new Server(server, {
    serveClient: false,
    // Reject cross-origin WebSocket / polling handshakes (WebSockets are not subject to CORS)
    allowRequest: socketIoAllowRequest(params.HTTP_CORS_WHITELIST)
  });

  // Subscriptions
  const subscriptions = subscriptionsFactory(io, subscriptionsLogger);
  mapSubscriptionsToEventBus(subscriptions, methods, eventBus);

  const rpcHandler = getRpcHandler(methods, routesLogger);

  app.use(helmetConf());
  // Intercept decentralized website requests first
  // TODO: research how to use auth in the proxy
  app.use(ethForwardMiddleware);
  // CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
  app.use(cors({ credentials: true, origin: params.HTTP_CORS_WHITELIST }));
  // CSRF protection: reject state-changing requests the browser reports as not same-origin.
  // The SameSite=Strict session cookie does not cover same-site origins such as other
  // HTTPS portal subdomains (https://<sub>.<hash>.dyndns.dappnode.io)
  const sameOrigin = sameOriginGuard(params.HTTP_CORS_WHITELIST);
  // Except for MCP clients that send their own `Origin`: the MCP bearer key is not an ambient
  // credential, a browser cannot attach it to a forged request. A /mcp request that presents one
  // and carries no cookie can only pass `onlyAdminOrMcpApiKey` with a valid key
  const isMcpPath = (req: express.Request): boolean => req.path === "/mcp" || req.path === "/mcp/";
  const isMcpBearerRequest = (req: express.Request): boolean =>
    isMcpPath(req) && req.headers.cookie === undefined && parseMcpBearerToken(req.headers.authorization) !== null;
  app.use((req, res, next) => (isMcpBearerRequest(req) ? next() : sameOrigin(req, res, next)));
  app.use(compression());
  const skipMcpBodyParser = (handler: RequestHandler): RequestHandler => {
    return (req, res, next) => {
      if (isMcpPath(req)) return next();
      return handler(req, res, next);
    };
  };
  const mcpJsonParser = bodyParser.json({ limit: MCP_UPLOAD_CHUNK_BASE64_CHARS + 256 * 1024 });
  // Only JSON bodies are parsed globally. HTML forms can only send urlencoded, multipart or
  // text/plain bodies without a CORS preflight, so JSON-only routes also use `requireJsonBody`.
  // text/plain is parsed only on the package routes that need it (/sign, /data-send)
  app.use(skipMcpBodyParser(bodyParser.json()));
  // Serve locally-downloaded package avatars (non-core from REPO_DIR, core from DNCORE_DIR)
  app.use("/avatars", express.static(path.resolve(dappnodeParams.avatarStaticDir), { maxAge: "1d" }));
  app.use("/avatars", express.static(path.resolve(dappnodeParams.coreAvatarStaticDir), { maxAge: "1d" }));
  // Intercept UI requests. Must go before express.static
  app.use(counterViewsMiddleware);
  // Express uses "ETags" (hashes of the files requested) to know when the file changed
  app.use(express.static(path.resolve(params.UI_FILES_PATH), { maxAge: "1d" }));

  // Sessions
  const sessions = new ClientSideCookies(params);
  app.use(sessions.handler);

  // Auth
  const auth = new AuthPasswordSession(sessions, adminPasswordDb, params);

  const ensureTempTransferDirMiddleware: RequestHandler = (_req, _res, next) => {
    ensureTempTransferDir();
    next();
  };

  // sessionHandler will mutate socket.handshake attaching .session object
  // Then, onlyAdmin will reject if socket.handshake.session.isAdmin !== true
  io.use(toSocketIoHandler(sessions.handler));
  io.use(toSocketIoHandler(auth.onlyAdmin));

  io.on("connection", (socket) => {
    console.log(`Socket connected`, socket.id);

    // JSON RPC over WebSockets
    socket.on("rpc", (rpcPayload: RpcPayload, callback: (res: RpcResponse) => void) => {
      if (typeof callback !== "function") return logs.error("JSON RPC over WS req without cb", rpcPayload);

      rpcHandler(rpcPayload)
        .then(callback)
        .catch((error) => callback({ error }))
        .catch((error) => logs.error("Error on JSON RPC over WS cb", error));
    });

    // If DAPPMANAGER's version has changed reload the client
    if (isNewDappmanagerVersion()) {
      subscriptions.reloadClient.emit({ reason: "New version" });
    }
  });

  // /change-pass checks the current password, so it gets a strict limiter of failed attempts. It goes
  // after the session check, so only requests with a valid session count.
  // TODO: /login has no limiter. It is unauthenticated and clients behind the same proxy share one IP,
  // so a per-IP limit would let anyone on that proxy lock the admin out of logging in
  app.post("/login-status", requireJsonBody, auth.loginAdminStatus);
  app.post("/login", requireJsonBody, auth.loginAdmin);
  app.post("/logout", requireJsonBody, auth.logoutAdmin);
  app.post("/change-pass", requireJsonBody, auth.onlyAdmin, getAuthLimiter(), auth.changeAdminPassword);
  app.post("/register", requireJsonBody, auth.registerAdmin);
  app.post("/recover-pass", requireJsonBody, auth.recoverAdminPassword);

  // Limit requests per IP for NON AUTH methods
  app.use(limiterMiddleware);

  // Ping - health check
  app.get("/ping", auth.onlyAdmin, (_, res) => res.send({}));

  // ADMIN ONLY methods that do not fit into RPC
  app.get("/wireguard-config/:device", auth.onlyAdmin, routes.downloadWireguardConfig);
  app.get("/container-logs/:containerName", auth.onlyAdmin, routes.containerLogs);
  app.get("/file-download/:containerName", auth.onlyAdmin, routes.fileDownload);
  app.get("/download/:fileId", auth.onlyAdmin, routes.download);
  app.post("/full-backup", auth.onlyAdminWithPasswordConfirmation, routes.fullBackupCreate);
  app.post("/full-backup/inspect", auth.onlyAdmin, routes.fullBackupInspect);
  app.get("/full-backup/pending/:fileName", auth.onlyAdmin, routes.fullBackupPendingDownload);
  app.post("/full-backup/restore", auth.onlyAdminWithPasswordConfirmation, routes.fullBackupRestore);
  app.get("/user-action-logs", auth.onlyAdmin, routes.downloadUserActionLogs);
  app.get("/avatar/ipfs/:cid", auth.onlyAdmin, createIpfsAvatarHandler(getIpfsFileBytes));
  // Keep capacity reservation and multipart parsing after authentication so
  // rejected requests cannot reserve disk or stream temporary files first.
  app.post(
    "/upload",
    auth.onlyAdmin,
    ensureTempTransferDirMiddleware,
    reserveHttpUploadCapacity,
    parseHttpUploadFile,
    routes.upload
  );

  // Nexus chat proxy (Nexus API key held server-side).
  // The login route performs an external auth exchange, so it also gets its own stricter limiter.
  // It goes after the session check so requests without a session cannot use up the admin's budget
  const nexusAuthLimiter = getNexusAuthLimiter();
  app.get("/nexus/status", auth.onlyAdmin, nexusStatus);
  app.post("/nexus/auth/login", requireJsonBody, auth.onlyAdmin, nexusAuthLimiter, nexusLogin);
  app.post("/nexus/config", requireJsonBody, auth.onlyAdmin, nexusSetApiKey);
  app.delete("/nexus/config", requireJsonBody, auth.onlyAdmin, nexusClearApiKey);
  app.post("/nexus/private-mode", requireJsonBody, auth.onlyAdmin, nexusSetPrivateMode);
  app.get("/nexus/private-mode/probe", auth.onlyAdmin, nexusProbePrivateMode);
  app.get("/nexus/models", auth.onlyAdmin, nexusListModels);
  app.post("/nexus/chat/completions", requireJsonBody, auth.onlyAdmin, nexusChatCompletions);
  app.post("/nexus/chat/confirm", requireJsonBody, auth.onlyAdmin, nexusChatConfirm);
  app.get("/nexus/chat/history", auth.onlyAdmin, nexusChatHistoryList);
  app.delete("/nexus/chat/history", requireJsonBody, auth.onlyAdmin, nexusChatHistoryClear);
  app.get("/nexus/chat/history/:id", auth.onlyAdmin, nexusChatHistoryGet);
  app.put("/nexus/chat/history/:id", requireJsonBody, auth.onlyAdmin, nexusChatHistoryUpsert);
  app.delete("/nexus/chat/history/:id", requireJsonBody, auth.onlyAdmin, nexusChatHistoryDelete);

  // Stateless MCP server for this DAppNode — same tools the embedded chat
  // uses, also reachable by external MCP clients (Claude Desktop, Cursor, etc.)
  // and by other DAppNode packages. Authentication: admin session cookie OR
  // `Authorization: Bearer <generated MCP API key>` from the admin UI at
  // System > Advanced > MCP API key.
  // A fresh transport is created per request so a stale client session can
  // never hold the MCP endpoint lock.
  app.post("/mcp", requireJsonBody, auth.onlyAdminOrMcpApiKey, mcpJsonParser, wrapHandler(handleMcpRequest));

  // Open endpoints (no auth)
  app.get("/global-envs/:name?", routes.globalEnvs);
  app.get("/env/:dnpName", routes.env);
  app.get("/public-packages/:containerName?", routes.publicPackagesData);
  app.get("/package-manifest/:dnpName", routes.packageManifest);
  app.get("/metrics", routes.metrics);
  // Called by packages with text/plain bodies
  app.post("/sign", bodyParser.text(), routes.sign);
  app.post("/data-send", bodyParser.text(), routes.dataSend);

  // Rest of RPC methods
  // prettier-ignore
  app.post("/rpc",requireJsonBody,auth.onlyAdmin,wrapHandler(async (req, res) => res.send(await rpcHandler(req.body))));

  // Default error handler must be the last
  // app.use(errorHandler);

  // Serve UI. React-router, index.html at all routes
  // prettier-ignore
  app.get("*", (_, res) => res.sendFile(path.resolve(params.UI_FILES_PATH, "index.html")));

  server.listen(params.HTTP_API_PORT, () => logs.info(`HTTP API ${params.HTTP_API_PORT}`));
  return server;
}
