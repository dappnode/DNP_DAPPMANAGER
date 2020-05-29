import { mapValues } from "lodash";
import { Args, LoggerMiddleware } from "../types";

interface SocketIsh {
  /**
   * Emits an event to the default Namespace
   * @param event The event that we want to emit
   * @param args Any number of optional arguments to pass with the event. If the
   * last argument is a function, it will be called as an ack. The ack should
   * take whatever data was sent with the packet
   * @return The default '/' Namespace
   */
  emit(event: string, ...args: any[]): any;
  /**
   * Base 'on' method to add a listener for an event
   * @param event The event that we want to add a listener for
   * @param listener The callback to call when we get the event. The parameters
   * for the callback depend on the event
   * @return The default '/' Namespace
   */
  on(event: string, listener: Function): any;
}

/**
 * Returns a callable subscriptions object
 *
 * ```js
 * interface Subscriptions {
 *   info: (message: string) => void
 * }
 * const subscriptions = subscriptionsFactory({ info: {} })
 *
 * subscriptions.info.on(message => console.log(arg))
 * subscriptions.info.emit("hello")
 * ```
 *
 * @param session
 * @param subscriptionsData
 * @param middleware
 */
export function subscriptionsFactory<Subscriptions>(
  io: SocketIsh,
  subscriptionsData: { [K in keyof Subscriptions]: {} },
  options?: {
    loggerMiddleware?: LoggerMiddleware;
    validateArgs?: (route: string, args: Args) => void;
  }
): {
  [K in keyof Subscriptions]: {
    emit: (...args: Args) => void;
    on: (handler: (...args: Args) => void) => void;
  };
} {
  const { loggerMiddleware, validateArgs } = options || {};
  const { onError } = loggerMiddleware || {};

  return mapValues(subscriptionsData, (_0, route) => {
    return {
      emit: async (...args: Args): Promise<void> => {
        // Use try / catch and await to be safe for async and sync methods
        try {
          io.emit(route, args);
        } catch (e) {
          if (onError) onError(`emit - ${route}`, e, args);
        }
      },
      on: (handler: (...args: Args) => void | Promise<void>): void => {
        io.on(route, async function endpoint(args?: Args): Promise<void> {
          // Use try / catch and await to be safe for async and sync methods
          try {
            if (validateArgs) validateArgs(route, args || []);
            await handler(...(args || []));
          } catch (e) {
            if (onError) onError(`on - ${route}`, e, args);
          }
        });
      }
    };
  });
}
