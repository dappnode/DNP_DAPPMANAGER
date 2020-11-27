import * as methods from "./methods";
import { startHttpApi } from "../../dappmanager/src/api/startHttpApi";
import { LoggerMiddleware } from "../src/common/transport/types";

/* eslint-disable no-console */

const routesLogger: LoggerMiddleware = {
  onCall: (route, args) => console.log("RPC request", route, args),
  onSuccess: (route, result) => console.log("RPC result", route, result),
  onError: (route, error) => console.log("RPC error", route, error)
};
const subscriptionsLogger: LoggerMiddleware = {
  onCall: (route, args) => console.log("Subscription", route, args),
  onError: (route, error) => console.log("Subscription error", route, error)
};

const server = startHttpApi({
  params: {
    DB_SESSIONS_PATH: "test_files",
    AUTH_IP_ALLOW_ALL_IPS: true,
    HTTP_API_PORT: process.env.PORT || 5000,
    UI_FILES_PATH: ".",
    HTTP_CORS_WHITELIST: ["http://localhost:3000", "http://localhost:3001"]
  },
  logs: {
    debug: console.log,
    info: console.log,
    warn: console.log,
    error: console.log
  },
  routes: {} as any,
  ethForwardMiddleware: (req, res, next) => {
    next();
  },
  methods,
  routesLogger,
  subscriptionsLogger,
  mapSubscriptionsToEventBus: () => {}
});

// Graceful shutdown
process.on("SIGINT", () => {
  server.close();
  process.exit(0);
});
