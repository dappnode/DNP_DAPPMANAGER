import http from "http";
import express, { RequestHandler } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import cors from "cors";
import socketio from "socket.io";
import path from "path";
import { errorHandler, toSocketIoHandler, wrapHandler } from "./utils";
import {
  getRpcHandler,
  subscriptionsFactory,
  RpcPayload,
  RpcResponse,
  LoggerMiddleware,
  Routes,
  Subscriptions
} from "../common";
import { AuthIp, AuthPasswordSession } from "./auth";
import { ServerSideCookies } from "./sessions";
import { Logs } from "../logs";

interface HttpApiParams {
  DB_SESSIONS_PATH: string;
  AUTH_IP_ALLOW_LOCAL_IP: boolean;
  HTTP_API_PORT: number | string;
  UI_FILES_PATH: string;
  HTTP_CORS_WHITELIST: string[];
  ADMIN_PASSWORD_FILE: string;
  ADMIN_RECOVERY_FILE: string;
  SESSIONS_SECRET_FILE: string;
}

interface HttpRoutes {
  containerLogs: RequestHandler<{ containerName: string }>;
  download: RequestHandler<{ fileId: string }>;
  downloadUserActionLogs: RequestHandler<{}>;
  globalEnvs: RequestHandler<{ name: string }>;
  packageManifest: RequestHandler<{ dnpName: string }>;
  publicPackagesData: RequestHandler<{ containerName: string }>;
  upload: RequestHandler<{}>;
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
  ethForwardMiddleware,
  routesLogger,
  methods,
  subscriptionsLogger,
  mapSubscriptionsToEventBus
}: {
  params: HttpApiParams;
  logs: Logs;
  routes: HttpRoutes;
  ethForwardMiddleware: express.RequestHandler;
  routesLogger: LoggerMiddleware;
  methods: Routes;
  subscriptionsLogger: LoggerMiddleware;
  mapSubscriptionsToEventBus(subscriptions: Subscriptions): void;
}): http.Server {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server, { serveClient: false });

  // Subscriptions
  const subscriptions = subscriptionsFactory(io, subscriptionsLogger);
  mapSubscriptionsToEventBus(subscriptions);

  const rpcHandler = getRpcHandler(methods, routesLogger);

  app.disable("x-powered-by");
  // Intercept decentralized website requests first
  app.use(ethForwardMiddleware);
  // default options. ALL CORS + limit fileSize and file count
  app.use(fileUpload({ limits: { fileSize: 500 * 1024 * 1024, files: 10 } }));
  // CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
  app.use(cors({ credentials: true, origin: params.HTTP_CORS_WHITELIST }));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.resolve(params.UI_FILES_PATH), { maxAge: "1d" })); // Express uses "ETags" (hashes of the files requested) to know when the file changed

  // Sessions
  const sessions = new ServerSideCookies(params);
  app.use(sessions.handler);

  // Auth
  const authIp = new AuthIp(params);
  const auth = new AuthPasswordSession(sessions, params);

  // sessionHandler will mutate socket.handshake attaching .session object
  // Then, onlyAdmin will reject if socket.handshake.session.isAdmin !== true
  io.use(toSocketIoHandler(sessions.handler));
  io.use(toSocketIoHandler(auth.onlyAdmin));

  io.on("connection", socket => {
    console.log(`Socket connected`, socket.id);

    // JSON RPC over WebSockets
    socket.on(
      "rpc",
      (rpcPayload: RpcPayload, callback: (res: RpcResponse) => void) => {
        if (typeof callback !== "function")
          return logs.error("JSON RPC over WS req without cb", rpcPayload);

        rpcHandler(rpcPayload)
          .then(callback)
          .catch(error => callback({ error }))
          .catch(error => logs.error("Error on JSON RPC over WS cb", error));
      }
    );
  });

  app.post("/login-status", auth.loginAdminStatus);
  app.post("/login", auth.loginAdmin);
  app.post("/logout", auth.logoutAdmin);
  app.post("/change-pass", auth.changeAdminPassword);
  app.post("/register", authIp.onlyAdminIp, auth.registerAdmin);
  app.post("/recover-pass", authIp.onlyAdminIp, auth.recoverAdminPassword);

  // Ping - health check
  app.get("/ping", auth.onlyAdmin, (_, res) => res.send({}));

  // Methods that do not fit into RPC
  // prettier-ignore
  app.get("/container-logs/:containerName", auth.onlyAdmin, routes.containerLogs);
  app.get("/download/:fileId", auth.onlyAdmin, routes.download);
  app.get("/user-action-logs", auth.onlyAdmin, routes.downloadUserActionLogs);
  app.post("/upload", auth.onlyAdmin, routes.upload);
  // Open endpoints (no auth)
  app.get("/global-envs/:name?", routes.globalEnvs);
  app.get("/public-packages/:containerName?", routes.publicPackagesData);
  app.get("/package-manifest/:dnpName", routes.packageManifest);

  // Rest of RPC methods
  app.post(
    "/rpc",
    auth.onlyAdmin,
    wrapHandler(async (req, res) => res.send(await rpcHandler(req.body)))
  );

  // Default error handler must be the last
  app.use(errorHandler);

  // Serve UI. React-router, index.html at all routes
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(params.UI_FILES_PATH, "index.html"))
  );

  server.listen(params.HTTP_API_PORT, () =>
    logs.info(`HTTP API ${params.HTTP_API_PORT}`)
  );
  return server;
}
