import { useEffect } from "react";
import io from "socket.io-client";
import useSWR, { responseInterface } from "swr";
import { mapValues } from "lodash";
import { store } from "../store";
// Transport
import { subscriptionsFactory } from "common/transport/socketIo";
import {
  Subscriptions,
  subscriptionsData,
  SubscriptionsTypes
} from "common/subscriptions";
import { Routes, routesData, ResolvedType } from "common/routes";
import { Args } from "common/transport/types";
// Internal
import { mapSubscriptionsToRedux } from "./subscriptions";
import {
  connectionOpen,
  connectionClose
} from "services/connectionStatus/actions";
import { initialCallsOnOpen } from "./initialCalls";
import { PubSub } from "./utils";
import { parseRpcResponse } from "common/transport/jsonRpc";
import { apiUrl, apiUrls } from "params";

const apiRpcUrl = apiUrls.rpc;
const socketIoUrl = apiUrl;

/**
 * Bridges events from the API websockets client to any consumer in the App
 * All WAMP events will be emitted in this PubSub instance
 * If a part of the App wants to subscribe to an event just do
 * ```
 * apiEventBridge.on(route, callback)
 * ```
 * Or use the hook `useSubscription`
 */
const apiEventBridge = new PubSub();

/**
 * Call a RPC route
 * @param route "restartPackage"
 * @param args ["bitcoin.dnp.dappnode.eth"]
 */
export async function callRoute<R>(route: string, args: any[]): Promise<R> {
  const res = await fetch(apiRpcUrl, {
    method: "post",
    body: JSON.stringify({ method: route, params: args }),
    headers: { "Content-Type": "application/json" }
  });

  // If body is not JSON log it to get info about the error. Express may respond with HTML
  const bodyText = await res.text();
  let body: any;
  try {
    body = JSON.parse(bodyText);
  } catch (e) {
    throw Error(
      `Error parsing JSON body (${res.status} ${res.statusText}): ${e.message}\n${bodyText}`
    );
  }

  if (!res.ok)
    throw Error(`${res.status} ${res.statusText} ${body.message || ""}`);

  // RPC response are always code 200
  return parseRpcResponse<R>(body);
}

export const api: Routes = mapValues(
  routesData,
  (data, route) => (...args: any[]) => callRoute<any>(route, args)
);

export const useApi: {
  [K in keyof Routes]: (
    ...args: Parameters<Routes[K]>
  ) => responseInterface<ResolvedType<Routes[K]>, Error>;
} = mapValues(api, (handler, route) => {
  return function(...args: any[]) {
    const argsKey = args.length > 0 ? JSON.stringify(args) : "";
    const fetcher: (...args: any[]) => Promise<any> = handler;
    return useSWR([route, argsKey], () => fetcher(...args));
  };
});

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
    useEffect(() => {
      apiEventBridge.on(route, callback);
      return () => {
        apiEventBridge.off(route, callback);
      };
    }, [callback]);
  };
});

/**
 * Connect to the server's API
 * Store the session and map subscriptions
 */
export function start() {
  const socket = io(socketIoUrl);

  socket.on("connect", function(...args: any) {
    const subscriptions = subscriptionsFactory<Subscriptions>(
      socket,
      subscriptionsData,
      { loggerMiddleware: subscriptionsLoggerMiddleware }
    );
    mapValues(subscriptions, (handler, route) => {
      handler.on((...args) => apiEventBridge.emit(route, ...args));
    });

    mapSubscriptionsToRedux(subscriptions);
    initialCallsOnOpen();

    // For testing:
    window.call = (event, args) => socket.emit(event, args);

    // Delay announcing session is open until everything is setup
    store.dispatch(connectionOpen());
    console.log(`SocketIO connected to ${socket.io.uri}, ID ${socket.id}`);
  });

  function handleConnectionError(err: Error | string): void {
    const errorMessage = err instanceof Error ? err.message : err;
    fetch(apiUrl).then(res => {
      if (res.ok) {
        // Warn that subscriptions are disabled
        store.dispatch(connectionOpen());
      } else {
        store.dispatch(
          connectionClose({
            error: errorMessage,
            isNotAdmin: false
          })
        );
      }
    });

    console.error("SocketIO connection closed", errorMessage);
  }

  // Handles server errors
  socket.io.on("connect_error", handleConnectionError);

  // Handles individual socket errors
  socket.on("disconnect", handleConnectionError);
}

const subscriptionsLoggerMiddleware = {
  onError: (route: string, error: Error, args?: Args): void => {
    console.error(`Subscription error ${route}: ${error.stack}`, args);
  }
};
