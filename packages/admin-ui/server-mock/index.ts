import http from "http";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import socketio from "socket.io";
import * as methods from "./methods";
import { mapSubscriptionsToEventBus } from "./subscriptions";
import { getRpcHandler } from "../src/common/transport/jsonRpc";
import { subscriptionsFactory } from "../src/common";
import {
  LoggerMiddleware,
  RpcPayload,
  RpcResponse
} from "../src/common/transport/types";

/* eslint-disable no-console */

const port = process.env.PORT || 5000;
const whitelist = ["http://localhost:3000", "http://localhost:3001"];

const loggerMiddleware: LoggerMiddleware = {
  onCall: (route, args) => console.log("RPC request", route, args),
  onSuccess: (route, result) => console.log("RPC result", route, result),
  onError: (route, error) => console.log("RPC error", route, error)
};
const subscriptionsLogger: LoggerMiddleware = {
  onCall: (route, args) => console.log("Subscription", route, args),
  onError: (route, error) => console.log("Subscription error", route, error)
};
const rpcHandler = getRpcHandler(methods, loggerMiddleware);

const app = express();
const server = new http.Server(app);
const io = socketio(server, { serveClient: false });

io.on("connection", socket => {
  console.log(`Socket connected`, socket.id);

  // JSON RPC over WebSockets
  socket.on(
    "rpc",
    (rpcPayload: RpcPayload, callback: (res: RpcResponse) => void) => {
      if (typeof callback !== "function")
        return console.error("JSON RPC over WS req without cb", rpcPayload);

      rpcHandler(rpcPayload)
        .then(callback)
        .catch(error => callback({ error }))
        .catch(error => console.error("Error on JSON RPC over WS cb", error));
    }
  );
});

// Subscriptions
const subscriptions = subscriptionsFactory(io, subscriptionsLogger);
mapSubscriptionsToEventBus(subscriptions);

// CORS config follows https://stackoverflow.com/questions/50614397/value-of-the-access-control-allow-origin-header-in-the-response-must-not-be-th
app.use(cors({ credentials: true, origin: whitelist }));
app.use(bodyParser.json());

// Ping / hello endpoint
app.get("/", (req, res) => res.send("Mock server"));
app.get("/ping", (req, res) => res.send(req.body));

// Rest of RPC methods
app.post("/rpc", (req, res) => {
  rpcHandler(req.body)
    .then(rpcResult => res.send(rpcResult))
    .catch(e =>
      res.status(500).send({ error: { message: e.message, data: e.stack } })
    );
});

server.listen(port, () => {
  console.warn(`Mock app listening http://localhost:${port}`);
});
