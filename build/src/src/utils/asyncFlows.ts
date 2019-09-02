import async from "async";
import { promisify } from "util";

type Callback = (err: Error | null, res: any) => void;

/**
 * Makes sure the target async function is running only once at every instant.
 * It's similar to throttle, but instead of waiting an interval it waits for
 * completition. It uses the async.cargo function to achieve this behaviour.
 *
 *  Requests:       || | | ||| |                              |
 *  Function runs:  |--------------->|------------->|         |---------->|
 *
 *                  Multiple rapid calls are queued           Then it will wait
 *                  but the function will run one             for future calls
 *                  last time since there has been            and run when
 *                  a call after it started running           requested
 *
 * [NOTE]: The target function should NEVER be called with different arguments
 * since the arguments of non-first callers will be ignored.
 * [ONLY] use this function in recurring state checks, i.e. `natRenewal/index.ts`
 *
 * @param fn Target function
 */
export function runOnlyOneSequentially(fn: (...args: any[]) => Promise<any>) {
  // create a cargo object with an infinite payload
  const cargo = async.cargo(function(
    tasks: { args: any[] }[],
    callback: () => void
  ) {
    fn(...tasks[0].args).then(() => {
      callback();
    });
  },
  1e9);

  return function(...args: any[]) {
    cargo.push({ args });
  };
}

/**
 * Makes sure the target function is running only once at every instant.
 * When it's called multiple times it will only run once and return the
 * SAME result to all calls that happened within that run.
 *
 * Requests:       | ||| | || |                      |
 * Function runs:  |--------------->|                |------------>|
 *
 * [NOTE]: The target function should NEVER be called with different arguments
 * since the arguments of non-first callers will be ignored.
 * [ONLY] use this function to query a state that changes with a low frequency.
 * For example: to check if a blockchain node is syncing: `utils/isSyncing.ts`
 *
 * @param fn Target function (Callback style)
 */
export function runOnlyOneReturnToAll(fn: (callback: Callback) => void) {
  // This variables act as a class constructor
  let isRunning = false;
  let waitingCallbacks: Callback[] = [];

  function throttledCallback(callback: Callback) {
    waitingCallbacks.push(callback);
    if (!isRunning) {
      isRunning = true;
      fn((err, res) => {
        waitingCallbacks.forEach(callback => callback(err, res));
        isRunning = false;
        waitingCallbacks = [];
      });
    }
  }

  return promisify(throttledCallback);
}

/**
 * Same as runOnlyOneReturnToAll but for async target functions
 *
 * @param fn Target function (Async style)
 */
export function runOnlyOneReturnToAllAsync(fn: () => Promise<any>) {
  function fnCallbackStyle(callback: Callback) {
    fn().then(
      // Convert an async fn to a callback style fn
      res => callback(null, res),
      err => callback(err, null)
    );
  }

  return runOnlyOneReturnToAll(fnCallbackStyle);
}

/**
 * Waits `ms` miliseconds
 *
 * @param ms Pause time (ms)
 */
export function pause(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
