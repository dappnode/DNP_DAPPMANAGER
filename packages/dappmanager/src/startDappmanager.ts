import http from "http";
import { RequestHandler } from "express";
import {
  AdminPasswordDb,
  AdminPasswordDbParams
} from "./api/auth/adminPasswordDb.js";
import { Logs } from "@dappnode/logger";
import { EventBus } from "@dappnode/eventbus";
import { LoggerMiddleware, Routes } from "@dappnode/common";
import { DeviceCalls } from "./calls/device/index.js";
import { startHttpApi, HttpApiParams, HttpRoutes } from "./api/startHttpApi.js";
import { VpnApiClient } from "./api/vpnApiClient.js";

interface DappmanagerParams extends HttpApiParams, AdminPasswordDbParams {}

export function startDappmanager({
  params,
  logs,
  routes,
  limiterMiddleware,
  counterViewsMiddleware,
  ethForwardMiddleware,
  routesLogger,
  methods,
  subscriptionsLogger,
  eventBus,
  isNewDappmanagerVersion,
  vpnApiClient
}: {
  params: DappmanagerParams;
  logs: Logs;
  routes: HttpRoutes;
  limiterMiddleware: RequestHandler;
  counterViewsMiddleware: RequestHandler;
  ethForwardMiddleware: RequestHandler;
  routesLogger: LoggerMiddleware;
  methods: Omit<Routes, keyof DeviceCalls>;
  subscriptionsLogger: LoggerMiddleware;
  eventBus: EventBus;
  isNewDappmanagerVersion: () => boolean;
  vpnApiClient: VpnApiClient;
}): http.Server {
  const adminPasswordDb = new AdminPasswordDb(params);
  const deviceCalls = new DeviceCalls({
    eventBus,
    adminPasswordDb,
    vpnApiClient
  });

  // Start HTTP API
  return startHttpApi({
    params,
    logs,
    routes,
    limiterMiddleware,
    counterViewsMiddleware,
    ethForwardMiddleware,
    routesLogger,
    methods: { ...methods, ...deviceCalls },
    subscriptionsLogger,
    adminPasswordDb,
    eventBus,
    isNewDappmanagerVersion
  });
}
