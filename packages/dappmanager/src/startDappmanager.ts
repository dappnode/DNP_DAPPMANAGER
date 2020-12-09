import http from "http";
import retry from "async-retry";
import { RequestHandler } from "express";
import {
  AdminPasswordDb,
  AdminPasswordDbParams
} from "./api/auth/adminPasswordDb";
import { Logs } from "./logs";
import { EventBus } from "./eventBus";
import { LoggerMiddleware, Routes } from "./types";
import { DeviceCalls } from "./calls/device";
import { startHttpApi, HttpApiParams, HttpRoutes } from "./api/startHttpApi";
import { VpnApiClient } from "./api/vpnApiClient";

interface DappmanagerParams extends HttpApiParams, AdminPasswordDbParams {}

export function startDappmanager({
  params,
  logs,
  routes,
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

  // Sync local adminPasswordDb status with VPN's DB
  retry(
    async function syncAdminPasswordDb() {
      for (const device of await vpnApiClient.listDevices())
        adminPasswordDb.setIsAdmin(device.id, device.admin);
    },
    { retries: 50, minTimeout: 2000, maxRetryTime: 5 * 60 * 1000 }
  )
    .then(() => logs.info("Synced adminPasswordDb with VPN devices"))
    .catch(e => logs.error("Èrror syncing adminPasswordDb", e));

  // Start HTTP API
  return startHttpApi({
    params,
    logs,
    routes,
    ethForwardMiddleware,
    routesLogger,
    methods: { ...methods, ...deviceCalls },
    subscriptionsLogger,
    adminPasswordDb,
    eventBus,
    isNewDappmanagerVersion
  });
}
