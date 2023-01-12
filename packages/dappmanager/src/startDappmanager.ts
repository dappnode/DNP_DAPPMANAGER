import http from "http";
import { RequestHandler } from "express";
import {
  AdminPasswordDb,
  AdminPasswordDbParams
} from "./api/auth/adminPasswordDb";
import { Logs } from "./logs";
import { EventBus } from "./eventBus";
import { LoggerMiddleware, Routes } from "@dappnode/common";
import { DeviceCalls } from "./calls/device";
import { SshCalls } from "./calls/ssh";
import { startHttpApi, HttpApiParams, HttpRoutes } from "./api/startHttpApi";
import { VpnApiClient } from "./api/vpnApiClient";
import { SshManager } from "./modules/sshManager";

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
  vpnApiClient,
  sshManager
}: {
  params: DappmanagerParams;
  logs: Logs;
  routes: HttpRoutes;
  limiterMiddleware: RequestHandler;
  counterViewsMiddleware: RequestHandler;
  ethForwardMiddleware: RequestHandler;
  routesLogger: LoggerMiddleware;
  methods: Omit<Routes, keyof DeviceCalls | keyof SshCalls>;
  subscriptionsLogger: LoggerMiddleware;
  eventBus: EventBus;
  isNewDappmanagerVersion: () => boolean;
  vpnApiClient: VpnApiClient;
  sshManager: SshManager;
}): http.Server {
  const adminPasswordDb = new AdminPasswordDb(params);
  const deviceCalls = new DeviceCalls({
    eventBus,
    adminPasswordDb,
    vpnApiClient
  });
  const sshCalls = new SshCalls({ sshManager });

  // Start HTTP API
  return startHttpApi({
    params,
    logs,
    routes,
    limiterMiddleware,
    counterViewsMiddleware,
    ethForwardMiddleware,
    routesLogger,
    methods: { ...methods, ...deviceCalls, ...sshCalls },
    subscriptionsLogger,
    adminPasswordDb,
    eventBus,
    isNewDappmanagerVersion
  });
}
