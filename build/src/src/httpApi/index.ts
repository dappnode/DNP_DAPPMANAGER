import http from "http";
import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import fileUpload from "express-fileupload";
import cors from "cors";
import socketio from "socket.io";
import params from "../params";
import { isAuthorized } from "./auth";
import { wrapHandler } from "./utils";
import { download } from "./routes/download";
import { upload } from "./routes/upload";
import { containerLogs } from "./routes/containerLogs";
import { getRpcHandler } from "../common/transport/jsonRpc";
import * as methods from "../calls";
import { subscriptionsFactory } from "../common/transport/socketIo";
import { mapSubscriptionsToEventBus } from "../api/subscriptions";
import { Subscriptions, subscriptionsData } from "../common/subscriptions";
import { validateSubscriptionsArgsFactory } from "../common/validation";
import {
  subscriptionsLoggerFactory,
  routesLoggerFactory
} from "../api/middleware";
import Logs from "../logs";
const logs = Logs(module);

const httpApiPort = params.HTTP_API_PORT;
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
 */
export default function startHttpApi(port: number = httpApiPort) {
  const app = express();
  const server = new http.Server(app);
  const io = socketio(server);

  io.on("connection", function(socket) {
    console.log(`Socket connected`, socket.id);
  });

  // Subscriptions
  const subscriptions = subscriptionsFactory<Subscriptions>(
    io,
    subscriptionsData,
    {
      loggerMiddleware: subscriptionsLoggerFactory(),
      validateArgs: validateSubscriptionsArgsFactory()
    }
  );
  mapSubscriptionsToEventBus(subscriptions);

  // RPC
  const loggerMiddleware = routesLoggerFactory();
  const rpcHandler = getRpcHandler(methods, loggerMiddleware);

  // default options. ALL CORS + limit fileSize and file count
  app.use(
    fileUpload({
      limits: { fileSize: 500 * 1024 * 1024, files: 10 }
    })
  );
  // CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
  app.use(cors({ credentials: true, origin: whitelist }));
  app.use(compression());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Ping / hello endpoint
  app.get("/", (req, res) => res.send("DAPPMANAGER HTTP API"));

  // Methods that do not fit into RPC
  app.get("/container-logs/:id", isAuthorized, wrapHandler(containerLogs));
  app.get("/download/:fileId", isAuthorized, wrapHandler(download));
  app.post("/upload", isAuthorized, wrapHandler(upload));

  // Rest of RPC methods
  app.post(
    "/rpc",
    isAuthorized,
    wrapHandler(async (req, res) => res.send(await rpcHandler(req.body)))
  );

  server.listen(port, () => logs.info(`HTTP API ${port}!`));
}
