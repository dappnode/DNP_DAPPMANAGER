import { Session, IRegistration } from "autobahn";
import { mapValues, isEmpty } from "lodash";
import { Args, RpcResult, LoggerMiddleware } from "../types";

// Keep the same event signature for backwards compatibility
const dappmanagerDomain = ".dappmanager.dnp.dappnode.eth";
const vpnDomain = ".vpn.dnp.dappnode.eth";
type WampDomain = typeof dappmanagerDomain | typeof vpnDomain;

// Crossbar autobahn client
// Uses RPC for actions and retrieve info and subscriptions
// to keep the client dynamic.
//
// For RPC transport uses a simple status object
// For subscription only emits on success

export async function registerRoutes<Routes>(
  session: Session,
  routes: Routes,
  options?: {
    loggerMiddleware?: LoggerMiddleware;
    domain?: WampDomain;
    validateArgs?: (route: string, args: Args) => void;
  }
): Promise<({ ok: boolean; message: string })[]> {
  return await Promise.all(
    Object.entries(routes).map(([route, handler]) =>
      registerRoute(session, route, handler, options).then(
        () => ({ ok: true, message: `Registered event: ${route}` }),
        e => ({
          ok: false,
          message: `Error registering event ${route}: ${(e || {}).error}`
        })
      )
    )
  );
}

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
  options?: {
    loggerMiddleware?: LoggerMiddleware;
    domain?: WampDomain;
    validateArgs?: (route: string, args: Args) => void;
  }
): Promise<IRegistration> {
  const { loggerMiddleware, domain = dappmanagerDomain, validateArgs } =
    options || {};
  const { onCall, onSuccess, onError } = loggerMiddleware || {};

  async function endpoint(
    args: Args = [],
    kwargs?: any
  ): Promise<RpcResult<R>> {
    try {
      // Be backwards compatible with previous kwargs semantics
      if ((args || []).length === 0 && !isEmpty(kwargs)) args = [kwargs];

      if (onCall) onCall(route, args);
      if (validateArgs) validateArgs(route, args);
      const result = await handler(...args);
      if (onSuccess) onSuccess(route, result, args);
      return { success: true, result };
    } catch (e) {
      if (onError) onError(route, e, args);
      return { success: false, message: e.message };
    }
  }

  return await session.register(route + domain, endpoint);
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
  args: Args,
  domain: WampDomain = dappmanagerDomain
): Promise<R> {
  try {
    const res: RpcResult<R> = await session
      .call<RpcResult<R>>(route + domain, args)
      .then(res => (typeof res === "string" ? JSON.parse(res) : res));
    // Handle route implementation errors
    if (res.success) return res.result;
    else throw Error(res.message);
  } catch (e) {
    const err: Error = parseWampError(e);
    throw err;
  }
}

/**
 * Handle transport error
 * Note: Autobahn errors are not structured normally.
 * e = { error: 'wamp.error.runtime_error', args: [ {} ], kwargs: {} }
 * e = { error: 'wamp.error.no_such_procedure', args: [ 'no callee registered for procedure <route-test.dappmanager.dnp.dappnode.eth>' ], kwargs: {} }
 * @param e
 */
export function parseWampError(
  e: Error | { message?: string; error?: Error; args?: any[] }
): Error {
  // Handle transport error
  // Note: Autobahn errors are not structured normally.
  // e = { error: 'wamp.error.runtime_error', args: [ {} ], kwargs: {} }
  // e = { error: 'wamp.error.no_such_procedure', args: [ 'no callee registered for procedure <route-test.dappmanager.dnp.dappnode.eth>' ], kwargs: {} }
  if (e instanceof Error) return e;
  if (e.message) return Error(e.message);
  if (e.error)
    return Error(
      [e.error, ...(Array.isArray(e.args) ? e.args : [])]
        .filter((arg: any) => typeof arg === "string")
        .join(" - ")
    );
  return Error(`Unknown autobahn transport error: ${JSON.stringify(e)}`);
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
  options?: {
    loggerMiddleware?: LoggerMiddleware;
    domain?: WampDomain;
    validateArgs?: (route: string, args: Args) => void;
  }
): {
  [K in keyof Subscriptions]: {
    emit: (...args: Args) => void;
    on: (handler: (...args: Args) => void) => void;
  }
} {
  const { loggerMiddleware, domain = dappmanagerDomain, validateArgs } =
    options || {};
  const { onError } = loggerMiddleware || {};

  return mapValues(subscriptionsData, (_0, route) => {
    const event = route + domain;
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
          // Use try / catch and await to be safe for async and sync methods
          try {
            if (validateArgs) validateArgs(route, args || []);
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
