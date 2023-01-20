import io, { Socket } from "socket.io-client";
import { Emitter } from "mitt";
import { Args, RpcPayload, RpcResponse } from "@dappnode/common";
import { IApiRpc } from "./interface";
import { socketIoUrl } from "params";
import { subscriptionsData } from "@dappnode/common";

let socketGlobal: Socket | null = null;
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

    socket.on("connect", function() {
      for (const route of Object.keys(subscriptionsData)) {
        socket.on(route, (...args: Args) => {
          apiEventBridge.emit(route, ...args);
        });
      }
      onConnect();
    });

    function handleConnectionError(err: Error | string): void {
      const errorMessage = err instanceof Error ? err.message : err;
      onError(errorMessage);
    }

    // Handles server errors
    socket.on("connect_error", handleConnectionError);

    // Handles middleware / authentication errors
    socket.on("error", handleConnectionError);

    // Handles individual socket errors
    socket.on("disconnect", handleConnectionError);
  }
};

function setupSocket(): Socket {
  if (!socketGlobal) {
    /* eslint-disable-next-line no-console */
    console.log("Connecting API with Socket.io to", socketIoUrl);
    socketGlobal = io(socketIoUrl);
  }
  return socketGlobal;
}
