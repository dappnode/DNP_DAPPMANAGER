import { Session, IRegistration } from "autobahn";
import { mapValues } from "lodash";
import { Args, RpcResult, LoggerMiddleware } from "../types";

// Keep the same event signature for backwards compatibility
const rpcDomain = ".dappmanager.dnp.dappnode.eth";
const getEvent = (route: string): string => route + rpcDomain;

// Crossbar autobahn client
// Uses RPC for actions and retrieve info and subscriptions
// to keep the client dynamic.
//
// For RPC transport uses a simple status object
// For subscription only emits on success

/**
 * Register a RPC route to the crossbar server
 * @param session
 * @param route "restartPackage"
 * @param handler
 * @param middleware
 */
export async function registerRoute<R>(
  session: Session,
  route: string,
  handler: (...args: Args) => Promise<R>,
  middleware: LoggerMiddleware
): Promise<IRegistration> {
  const { onCall, onSuccess, onError } = middleware || {};
  async function endpoint(args?: Args): Promise<RpcResult<R>> {
    try {
      if (onCall) onCall(route, args);
      const result = await handler(...(args || []));
      if (onSuccess) onSuccess(route, result, args);
      return { success: true, result };
    } catch (e) {
      if (onError) onError(route, e, args);
      return { success: false, message: e.message };
    }
  }

  return await session.register(getEvent(route), endpoint);
}

/**
 * Call a RPC route through an autobahn session
 * @param session
 * @param route "restartPackage"
 * @param args ["bitcoin.dnp.dappnode.eth"]
 */
export async function callRoute<R>(
  session: Session,
  route: string,
  args: Args
): Promise<R> {
  try {
    const res = await session.call<RpcResult<R>>(getEvent(route), args);
    // Handle route implementation errors
    if (res.success) return res.result;
    else throw Error(res.message);
  } catch (e) {
    // Handle transport error
    // Note: Autobahn errors are not structured normally.
    // e = { error: 'wamp.error.runtime_error', args: [ {} ], kwargs: {} }
    // e = { error: 'wamp.error.no_such_procedure', args: [ 'no callee registered for procedure <route-test.dappmanager.dnp.dappnode.eth>' ], kwargs: {} }
    if (e instanceof Error) throw e;
    if (e.message) throw Error(e.message);
    if (e.error) {
      throw Error(
        [e.error, ...(Array.isArray(e.args) ? e.args : [])]
          .filter((arg: any) => typeof arg === "string")
          .join(" - ")
      );
    }
    throw Error(`Unknown autobahn transport error: ${JSON.stringify(e)}`);
  }
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
  session: Session,
  subscriptionsData: { [K in keyof Subscriptions]: {} },
  middleware: LoggerMiddleware
): {
  [K in keyof Subscriptions]: {
    emit: (...args: Args) => void;
    on: (handler: (...args: Args) => void) => void;
  }
} {
  const { onError } = middleware || {};
  return mapValues(subscriptionsData, (data, route) => {
    const event = getEvent(route);
    return {
      emit: async (...args: Args): Promise<void> => {
        try {
          // Use try / catch and await to be safe for async and sync methods
          await session.publish(event, args);
        } catch (e) {
          // autobahn returns a wierd error
          const errorMessage =
            typeof e === "object" ? (e.stack ? e.stack : JSON.stringify(e)) : e;
          if (onError) onError(`emit - ${route}`, Error(errorMessage), args);
        }
      },
      on: (handler: (...args: Args) => void | Promise<void>): void => {
        async function endpoint(args?: Args): Promise<void> {
          try {
            // Use try / catch and await to be safe for async and sync methods
            await handler(...(args || []));
          } catch (e) {
            if (onError) onError(`on - ${route}`, e, args);
          }
        }
        session.subscribe(event, endpoint);
      }
    };
  });
}
