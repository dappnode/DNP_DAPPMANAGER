import { useEffect } from "react";
import io from "socket.io-client";
import useSWR, { responseInterface } from "swr";
import { mapValues } from "lodash";
import mitt from "mitt";
// Transport
import { subscriptionsFactory } from "common/transport/socketIo";
import {
  Subscriptions,
  subscriptionsData,
  SubscriptionsTypes
} from "common/subscriptions";
import { Routes, routesData, ResolvedType } from "common/routes";
import { Args, RpcPayload, RpcResponse } from "common/transport/types";
// Internal
import { mapSubscriptionsToRedux } from "./subscriptions";
import { initialCallsOnOpen } from "./initialCalls";
import { parseRpcResponse } from "common/transport/jsonRpc";
import { apiUrl, apiUrls } from "params";

let socketGlobal: SocketIOClient.Socket;

function setupSocket(): SocketIOClient.Socket {
  if (!socketGlobal) {
    const socketIoUrl = apiUrl;
    /* eslint-disable-next-line no-console */
    console.log(`Connecting to API at`, apiUrl, apiUrls.rpc);
    socketGlobal = io(socketIoUrl);
  }
  return socketGlobal;
}

const routeSubscription: Partial<
  {
    [K in keyof Routes]: keyof Subscriptions;
  }
> = {
  autoUpdateDataGet: "autoUpdateData",
  devicesList: "devices",
  getUserActionLogs: "userActionLog",
  notificationsGet: "pushNotification",
  packageGet: "packages",
  packagesGet: "packages",
  systemInfoGet: "systemInfo",
  volumesGet: "volumes"
};

/**
 * Bridges events from the API websockets client to any consumer in the App
 * All WAMP events will be emitted in this PubSub instance
 * If a part of the App wants to subscribe to an event just do
 * ```
 * apiEventBridge.on(route, callback)
 * ```
 * Or use the hook `useSubscription`
 */
const apiEventBridge = mitt();

/**
 * Call a RPC route
 * @param route "restartPackage"
 * @param args ["bitcoin.dnp.dappnode.eth"]
 */
export async function callRoute<R>(route: string, args: any[]): Promise<R> {
  const socket = setupSocket();
  const rpcPayload: RpcPayload = { method: route, params: args };
  const rpcResponse = await new Promise<RpcResponse<R>>(resolve => {
    socket.emit("rpc", rpcPayload, resolve);
  });
  return parseRpcResponse(rpcResponse);
}

export const api: Routes = mapValues(
  routesData,
  (data, route) => (...args: any[]) => callRoute<any>(route, args)
);

export const useApi: {
  [K in keyof Routes]: (
    ...args: Parameters<Routes[K]>
  ) => responseInterface<ResolvedType<Routes[K]>, Error>;
} = mapValues(routesData, (data, route) => {
  return function(...args: any[]) {
    const argsKey = args.length > 0 ? JSON.stringify(args) : "";
    const fetcher = (...args: any[]) => callRoute<any>(route, args);
    const res = useSWR([route, argsKey], () => fetcher(...args));

    // Attach optional subscriptions
    const subscriptionRoute = routeSubscription[route as keyof Routes];
    if (subscriptionRoute) useSubscribe(subscriptionRoute, res.revalidate);

    return res;
  };
});

/**
 * Bridges a single event from the API websockets client to any consumer in the App
 * **Note**: this callback MUST be memoized
 */
export function useSubscribe(
  route: keyof Subscriptions,
  callback: (data: any) => void
): void {
  useEffect(() => {
    apiEventBridge.on(route, callback);
    return () => {
      apiEventBridge.off(route, callback);
    };
  }, [route, callback]);
}

/**
 * Bridges events from the API websockets client to any consumer in the App
 * **Note**: this callback MUST be memoized
 * or the hook will unsubscribe and re-subscribe the new callback on each
 * re-render.
 * ```
 * // Non changing callback
 * const [devices, setDevices] = useState<VpnDevice[]>();
 * useSubscription.devices(setDevices);
 *
 * // Changing callback, requires memoization
 * useSubscription.devices(
 *  useMemo(
 *    data => setDevices(data),
 *    [dependency]
 *  )
 *);
 * ```
 */
export const useSubscription: {
  [K in keyof Subscriptions]: (
    callback: (...args: Parameters<SubscriptionsTypes[K]>) => void
  ) => void;
} = mapValues(subscriptionsData, (data, route) => {
  return function(callback: (...args: any) => void) {
    useSubscribe(route as keyof Subscriptions, callback);
  };
});

let apiStarted = false;
/**
 * Connect to the server's API
 * Store the session and map subscriptions
 */
export function start({ refetchStatus }: { refetchStatus: () => void }) {
  // Only run start() once
  if (apiStarted) return;
  else apiStarted = true;

  const socket = setupSocket();

  socket.on("connect", function(...args: any) {
    const subscriptions = subscriptionsFactory(socket, subscriptionsLogger);
    mapValues(subscriptions, (handler, route) => {
      handler.on((...args: any[]) => apiEventBridge.emit(route, ...args));
    });

    mapSubscriptionsToRedux(subscriptions);
    initialCallsOnOpen();

    /* eslint-disable-next-line no-console */
    console.log(`SocketIO connected to ${socket.io.uri}, ID ${socket.id}`);

    // When Socket.io re-establishes connection check if still logged in
    refetchStatus();
  });

  function handleConnectionError(err: Error | string): void {
    const errorMessage = err instanceof Error ? err.message : err;
    console.error("SocketIO connection closed", errorMessage);
    refetchStatus();
  }

  // Handles server errors
  socket.io.on("connect_error", handleConnectionError);

  // Handles middleware / authentication errors
  socket.on("error", handleConnectionError);

  // Handles individual socket errors
  socket.on("disconnect", handleConnectionError);
}

const subscriptionsLogger = {
  onError: (route: string, error: Error, args?: Args): void => {
    console.error(`Subscription error ${route}: ${error.stack}`, args);
  }
};
