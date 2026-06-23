import http from "http";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import { helmetConf } from "./helmet.js";
import cors from "cors";
import { Server } from "socket.io";
import path from "path";
import { toSocketIoHandler, wrapHandler } from "./utils.js";
import { AuthPasswordSession, AuthPasswordSessionParams } from "./auth/index.js";
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
  nexusChatHistoryDelete,
  nexusChatHistoryGet,
  nexusChatHistoryList,
  nexusChatHistoryUpsert,
  nexusClearApiKey,
  nexusListModels,
  nexusSetApiKey,
  nexusStatus
} from "./routes/nexus.js";
import { handleMcpRequest } from "../mcp/server.js";
import { MCP_UPLOAD_CHUNK_BASE64_CHARS } from "../mcp/upload.js";
import { params as dappnodeParams } from "@dappnode/params";
import { ensureTempTransferDir, MAX_UPLOAD_FILE_SIZE_BYTES } from "../uploads/tempTransfer.js";

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
  isNewDappmanagerVersion
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
}): http.Server {
  const app = express();
  const server = new http.Server(app);
  const io = new Server(server, { serveClient: false });

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
  app.use(compression());
  const defaultJsonParser = bodyParser.json();
  const mcpJsonParser = bodyParser.json({ limit: MCP_UPLOAD_CHUNK_BASE64_CHARS + 256 * 1024 });
  app.use((req, res, next) => {
    const jsonParser = req.path === "/mcp" ? mcpJsonParser : defaultJsonParser;
    jsonParser(req, res, next);
  });
  app.use(bodyParser.text());
  app.use(bodyParser.urlencoded({ extended: true }));
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

  // Route-local upload parser. It intentionally runs after auth so rejected
  // requests cannot stream large temporary files to disk first.
  const uploadFileMiddleware = fileUpload({
    limits: { fileSize: MAX_UPLOAD_FILE_SIZE_BYTES, files: 10 },
    useTempFiles: true,
    tempFileDir: dappnodeParams.TEMP_TRANSFER_DIR
  });

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

  app.post("/login-status", auth.loginAdminStatus);
  app.post("/login", auth.loginAdmin);
  app.post("/logout", auth.logoutAdmin);
  app.post("/change-pass", auth.changeAdminPassword);
  app.post("/register", auth.registerAdmin);
  app.post("/recover-pass", auth.recoverAdminPassword);

  // Limit requests per IP for NON AUTH methods
  // TODO: implement a more sophisticated rate limiter for auth methods
  app.use(limiterMiddleware);

  // Ping - health check
  app.get("/ping", auth.onlyAdmin, (_, res) => res.send({}));

  // ADMIN ONLY methods that do not fit into RPC
  app.get("/wireguard-config/:device", auth.onlyAdmin, routes.downloadWireguardConfig);
  app.get("/container-logs/:containerName", auth.onlyAdmin, routes.containerLogs);
  app.get("/file-download/:containerName", auth.onlyAdmin, routes.fileDownload);
  app.get("/download/:fileId", auth.onlyAdmin, routes.download);
  app.get("/user-action-logs", auth.onlyAdmin, routes.downloadUserActionLogs);
  app.post("/upload", auth.onlyAdmin, ensureTempTransferDirMiddleware, uploadFileMiddleware, routes.upload);

  // Nexus chat proxy (Nexus API key held server-side).
  app.get("/nexus/status", auth.onlyAdmin, nexusStatus);
  app.post("/nexus/config", auth.onlyAdmin, nexusSetApiKey);
  app.delete("/nexus/config", auth.onlyAdmin, nexusClearApiKey);
  app.get("/nexus/models", auth.onlyAdmin, nexusListModels);
  app.post("/nexus/chat/completions", auth.onlyAdmin, nexusChatCompletions);
  app.post("/nexus/chat/confirm", auth.onlyAdmin, nexusChatConfirm);
  app.get("/nexus/chat/history", auth.onlyAdmin, nexusChatHistoryList);
  app.get("/nexus/chat/history/:id", auth.onlyAdmin, nexusChatHistoryGet);
  app.put("/nexus/chat/history/:id", auth.onlyAdmin, nexusChatHistoryUpsert);
  app.delete("/nexus/chat/history/:id", auth.onlyAdmin, nexusChatHistoryDelete);

  // Stateless MCP server for this DAppNode — same tools the embedded chat
  // uses, also reachable by external MCP clients (Claude Desktop, Cursor, etc.)
  // and by other DAppNode packages. Authentication: admin session cookie OR
  // `Authorization: Bearer <generated MCP API key>` from the admin UI at
  // System > Advanced > MCP API key.
  // A fresh transport is created per request so a stale client session can
  // never hold the MCP endpoint lock.
  app.post("/mcp", auth.onlyAdminOrMcpApiKey, wrapHandler(handleMcpRequest));

  // Open endpoints (no auth)
  app.get("/global-envs/:name?", routes.globalEnvs);
  app.get("/env/:dnpName", routes.env);
  app.get("/public-packages/:containerName?", routes.publicPackagesData);
  app.get("/package-manifest/:dnpName", routes.packageManifest);
  app.get("/metrics", routes.metrics);
  app.post("/sign", routes.sign);
  app.post("/data-send", routes.dataSend);

  // Rest of RPC methods
  // prettier-ignore
  app.post("/rpc",auth.onlyAdmin,wrapHandler(async (req, res) => res.send(await rpcHandler(req.body))));

  // Default error handler must be the last
  // app.use(errorHandler);

  // Serve UI. React-router, index.html at all routes
  // prettier-ignore
  app.get("*", (_, res) => res.sendFile(path.resolve(params.UI_FILES_PATH, "index.html")));

  server.listen(params.HTTP_API_PORT, () => logs.info(`HTTP API ${params.HTTP_API_PORT}`));
  return server;
}
