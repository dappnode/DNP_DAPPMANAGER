import { useEffect } from "react";
import useSWR, { responseInterface } from "swr";
import { mapValues } from "lodash-es";
import mitt from "mitt";
// Transport
import {
  Subscriptions,
  subscriptionsData,
  SubscriptionsTypes,
  Routes,
  routesData,
  ResolvedType,
  parseRpcResponse,
  subscriptionsFactory
} from "@dappnode/common";
// Internal
import { mapSubscriptionsToRedux } from "./subscriptions";
import { initialCallsOnOpen } from "./initialCalls";
import { LoginStatus as _LoginStatus } from "./interface";
import { apiAuth } from "./auth";
import { apiRoutes } from "./routes";
import { apiRpc } from "./rpc";
import { subscriptionsLogger } from "./utils";

export type LoginStatus = _LoginStatus;
export { apiAuth };
export { apiRoutes };

// Inject mock API code to have a workable UI offline
// Usefull for developing and testing UI elements without any server
if (process.env.REACT_APP_MOCK) {
  import("./mock").then(mock => {
    Object.assign(apiAuth, mock.apiAuth);
    Object.assign(apiRoutes, mock.apiRoutes);
    Object.assign(apiRpc, mock.apiRpc);
  });
}

/* eslint-disable no-console */

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

// Map redux subscriptions to eventBridge
mapSubscriptionsToRedux(
  subscriptionsFactory(apiEventBridge, subscriptionsLogger)
);

export async function startApi(refetchStatus: () => void) {
  apiRpc.start(
    apiEventBridge,
    function onConnect() {
      initialCallsOnOpen();

      console.log("SocketIO connected");
      // When Socket.io re-establishes connection check if still logged in
      refetchStatus();
    },
    function onError(errorMessage: string) {
      console.error("SocketIO connection closed", errorMessage);
      refetchStatus();
    }
  );
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
 * Call a RPC route
 * @param route "restartPackage"
 * @param args ["bitcoin.dnp.dappnode.eth"]
 */
async function callRoute<R>(method: string, params: any[]): Promise<R> {
  const rpcResponse = await apiRpc.call<R>({ method, params });
  return parseRpcResponse(rpcResponse);
}

/**
 * Typed API object to perform RPC calls
 */
export const api: Routes = mapValues(
  routesData,
  (data, route) => (...args: any[]) => callRoute<any>(route, args)
);

/**
 * React hook to perform RPC calls on component mount
 * Usefull to keep track of changing data that may need to be revalidated
 */
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
 * React hook to subscribe to generic events
 * Bridges a single event from the websockets API client to any consumer in the App
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
 * React hook to subscribe to typed events
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
