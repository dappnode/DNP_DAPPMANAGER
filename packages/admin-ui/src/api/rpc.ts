import io from "socket.io-client";
import { Emitter } from "mitt";
import { mapValues } from "lodash";
import { Args, RpcPayload, RpcResponse } from "common/transport/types";
import { subscriptionsFactory } from "common";
import { IApiRpc } from "./interface";
import { socketIoUrl } from "params";

let socketGlobal: SocketIOClient.Socket | null = null;
let apiStarted = false;

export const apiRpc: IApiRpc = {
  async call<R>(payload: RpcPayload) {
    const socket = setupSocket();
    return await new Promise<RpcResponse<R>>(resolve => {
      socket.emit("rpc", payload, resolve);
    });
  },

  start(apiEventBridge: Emitter, onConnect, onError) {
    // Only run start() once
    if (apiStarted) {
      return;
    } else {
      apiStarted = true;
    }

    const socket = setupSocket();

    socket.on("connect", function(...args: any) {
      const subscriptions = subscriptionsFactory(socket, subscriptionsLogger);
      mapValues(subscriptions, (handler, route) => {
        handler.on((...args: any[]) => apiEventBridge.emit(route, ...args));
      });

      onConnect();
    });

    function handleConnectionError(err: Error | string): void {
      const errorMessage = err instanceof Error ? err.message : err;
      onError(errorMessage);
    }

    // Handles server errors
    socket.io.on("connect_error", handleConnectionError);

    // Handles middleware / authentication errors
    socket.on("error", handleConnectionError);

    // Handles individual socket errors
    socket.on("disconnect", handleConnectionError);
  }
};

function setupSocket(): SocketIOClient.Socket {
  if (!socketGlobal) {
    /* eslint-disable-next-line no-console */
    console.log("Connecting API with Socket.io to", socketIoUrl);
    socketGlobal = io(socketIoUrl);
  }
  return socketGlobal;
}

const subscriptionsLogger = {
  onError: (route: string, error: Error, args?: Args): void => {
    console.error(`Subscription error ${route}: ${error.stack}`, args);
  }
};
