import http from "http";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import cors from "cors";
import socketio from "socket.io";
import path from "path";
import params from "../params";
import {
  changeAdminPassword,
  loginAdmin,
  logoutAdmin,
  onlyAdmin,
  onlyAdminByIp,
  registerAdmin
} from "./auth";
import { errorHandler, toSocketIoHandler, wrapHandler } from "./utils";
import * as methods from "../calls";
import { mapSubscriptionsToEventBus } from "../api/subscriptions";
import {
  getRpcHandler,
  subscriptionsFactory,
  RpcPayload,
  RpcResponse
} from "../common";
import { getEthForwardHandler, isDwebRequest } from "../ethForward";
import { subscriptionsLogger, routesLogger } from "./logger";
import { logs } from "../logs";
// Routes
import { download } from "./routes/download";
import { upload } from "./routes/upload";
import { containerLogs } from "./routes/containerLogs";
import { downloadUserActionLogs } from "./routes/downloadUserActionLogs";
import { globalEnvs } from "./routes/globalEnvs";
import { publicPackagesData } from "./routes/publicPackagesData";
import { packageManifest } from "./routes/packageManifest";
import { sessionHandler } from "./sessions";

const httpApiPort = params.HTTP_API_PORT;
const uiFilesPath = params.UI_FILES_PATH;
const whitelist = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://my.dappnode"
];

/**
 * HTTP API
 *
 * [NOTE] This API is not secure
 * - It can't use HTTPS for the limitations with internal IPs certificates
 *
 * [NOTE] To enable express debugging set ENV DEBUG=express:*
 */
export default function startHttpApi(
  port: number | string = httpApiPort
): http.Server {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server, { serveClient: false });

  // Subscriptions
  const subscriptions = subscriptionsFactory(io, subscriptionsLogger);
  mapSubscriptionsToEventBus(subscriptions);

  const rpcHandler = getRpcHandler(methods, routesLogger);
  const ethForwardHandler = getEthForwardHandler();

  app.disable("x-powered-by");
  // Intercept decentralized website requests first
  app.use((req, res, next) => {
    if (isDwebRequest(req)) ethForwardHandler(req, res);
    else next();
  });
  // default options. ALL CORS + limit fileSize and file count
  app.use(fileUpload({ limits: { fileSize: 500 * 1024 * 1024, files: 10 } }));
  // CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
  app.use(cors({ credentials: true, origin: whitelist }));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.resolve(uiFilesPath), { maxAge: "1d" })); // Express uses "ETags" (hashes of the files requested) to know when the file changed
  app.use(sessionHandler);

  // sessionHandler will mutate socket.handshake attaching .session object
  // Then, onlyAdmin will reject if socket.handshake.session.isAdmin !== true
  io.use(toSocketIoHandler(sessionHandler));
  io.use(toSocketIoHandler(onlyAdmin));

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

  app.post("/login", loginAdmin);
  app.post("/logout", onlyAdmin, logoutAdmin);
  app.post("/register", onlyAdminByIp, registerAdmin);
  app.post("/change-pass", onlyAdminByIp, changeAdminPassword);

  // Ping - health check
  app.get("/ping", onlyAdmin, (_, res) => res.send({}));

  // Methods that do not fit into RPC
  app.get("/container-logs/:containerName", onlyAdmin, containerLogs);
  app.get("/download/:fileId", onlyAdmin, download);
  app.get("/user-action-logs", onlyAdmin, downloadUserActionLogs);
  app.post("/upload", onlyAdmin, upload);
  // Open endpoints (no auth)
  app.get("/global-envs/:name?", globalEnvs);
  app.get("/public-packages/:containerName?", publicPackagesData);
  app.get("/package-manifest/:dnpName", packageManifest);

  // Rest of RPC methods
  app.post(
    "/rpc",
    onlyAdmin,
    wrapHandler(async (req, res) => res.send(await rpcHandler(req.body)))
  );

  // Default error handler must be the last
  app.use(errorHandler);

  // Serve UI. React-router, index.html at all routes
  app.get("*", (req, res) =>
    res.sendFile(path.resolve(uiFilesPath, "index.html"))
  );

  server.listen(port, () => logs.info(`HTTP API ${port}`));
  return server;
}
