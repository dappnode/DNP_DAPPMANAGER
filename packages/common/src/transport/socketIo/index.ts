import Ajv from "ajv";
import { mapValues } from "lodash-es";
import { Args, LoggerMiddleware } from "../../types";
import { Subscriptions, subscriptionsData } from "../../subscriptions.js";

const ajv = new Ajv({ allErrors: true });

interface SocketIsh {
  /**
   * Emits an event to the default Namespace
   * @param event The event that we want to emit
   * @param args Any number of optional arguments to pass with the event. If the
   * last argument is a function, it will be called as an ack. The ack should
   * take whatever data was sent with the packet
   * @returns The default '/' Namespace
   */
  emit(event: string, ...args: any[]): any;
  /**
   * Base 'on' method to add a listener for an event
   * @param event The event that we want to add a listener for
   * @param listener The callback to call when we get the event. The parameters
   * for the callback depend on the event
   * @returns The default '/' Namespace
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
 */
export function subscriptionsFactory(
  io: SocketIsh,
  subscriptionsArgumentsSchema: any,
  loggerMiddleware?: LoggerMiddleware
): Subscriptions {
  const { onCall, onError } = loggerMiddleware || {};
  const validateArgs = ajv.compile(subscriptionsArgumentsSchema);

  return mapValues(subscriptionsData, (_0, route) => {
    return {
      emit: async (...args: Args): Promise<void> => {
        // Use try / catch and await to be safe for async and sync methods
        try {
          if (onCall) onCall(`emit - ${route}`, args);
          io.emit(route, ...args);
        } catch (e) {
          if (onError) onError(`emit - ${route}`, e, args);
        }
      },
      on: (handler: (...args: Args) => void | Promise<void>): void => {
        io.on(route, async function(...args: Args): Promise<void> {
          // Use try / catch and await to be safe for async and sync methods
          try {
            if (onCall) onCall(`on - ${route}`, args);

            // Validate params
            const valid = validateArgs({ [route]: args });
            if (!valid) throw Error(formatErrors(validateArgs.errors, route));

            await handler(...args);
          } catch (e) {
            if (onError) onError(`on - ${route}`, e, args);
          }
        });
      },
    };
  });
}

function formatErrors(
  errors: Array<Ajv.ErrorObject> | null | undefined,
  route: string
): string {
  const dataVar = `root_prop`;
  const toReplace = `${dataVar}.${route}`;
  const errorsText = ajv.errorsText(errors, { separator: "\n", dataVar });
  return (
    "Validation error:\n" +
    errorsText.replace(new RegExp(toReplace, "g"), "params")
  );
}
