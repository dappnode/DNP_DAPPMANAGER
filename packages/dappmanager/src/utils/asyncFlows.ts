import async from "async";
import memoize from "memoizee";
import { logs } from "../logs.js";
import _ from "lodash-es";

/**
 * Throw this error when an upstream abort signal aborts
 */
export class ErrorAborted extends Error {
  constructor(message?: string) {
    super(`Aborted ${message || ""}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**Combines Lodash's _.debounce with _.memoize to allow for debouncing
 * based on parameters passed to the function during runtime.
 *
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @param options Lodash debounce options object.
 * @param resolver The function to resolve the cache key.
 */
export function memoizeDebounce<F extends AnyFunction>(
  func: F,
  wait = 0,
  options: _.DebounceSettings = {},
  resolver?: (...args: Parameters<F>) => unknown
): MemoizeDebouncedFunction<F> {
  const debounceMemo = _.memoize<
    (...args: Parameters<F>) => _.DebouncedFunc<F>
  >(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (..._args: Parameters<F>) => _.debounce(func, wait, options),
    resolver
  );

  function wrappedFunction(
    this: MemoizeDebouncedFunction<F>,
    ...args: Parameters<F>
  ): ReturnType<F> | undefined {
    return debounceMemo(...args)(...args);
  }

  const flush: MemoizeDebouncedFunction<F>["flush"] = (...args) => {
    return debounceMemo(...args).flush();
  };

  const cancel: MemoizeDebouncedFunction<F>["cancel"] = (...args) => {
    return debounceMemo(...args).cancel();
  };

  wrappedFunction.flush = flush;
  wrappedFunction.cancel = cancel;

  return wrappedFunction;
}

export interface MemoizeDebouncedFunction<F extends AnyFunction>
  extends _.DebouncedFunc<F> {
  (...args: Parameters<F>): ReturnType<F> | undefined;
  flush: (...args: Parameters<F>) => ReturnType<F> | undefined;
  cancel: (...args: Parameters<F>) => void;
}

/**
 * Abortable async setInterval that runs its callback once at max between `intervalMs` at minimum
 * Returns on aborted
 */
export async function runAtMostEvery(
  fn: () => Promise<void>,
  intervalMs: number,
  signal: AbortSignal
): Promise<void> {
  runAtMostEveryIntervals(fn, [intervalMs], signal);
}

/**
 * Like setInterval but you can pass a list ms values
 *
 * **Example**
 * ```js
 * setIntervalDynamic(callback, [1000, 2000, 3000])
 * ```
 * - First interval will take 1000 ms
 * - Second interval will take 2000 ms
 * - Third and all subsequent will take 3000 ms
 *
 * @param fn callback
 * @param msArray [1000, 2000, 3000]
 */
export async function runAtMostEveryIntervals(
  fn: () => Promise<void>,
  intervalsMs: number[],
  signal: AbortSignal
): Promise<void> {
  let lastRunMs = 0;

  const intervalMsFinal = intervalsMs[intervalsMs.length - 1];
  if (intervalMsFinal === undefined)
    throw Error(`msArray must have at least one element`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    lastRunMs = Date.now();

    await fn().catch(e => {
      console.error("Callbacks in runAtMostEvery should never throw", e);
    });

    const intervalMs = intervalsMs.shift() || intervalMsFinal;
    const sleepTime = Math.max(intervalMs + lastRunMs - Date.now(), 0);

    try {
      await sleep(sleepTime, signal);
    } catch (e) {
      if (e instanceof ErrorAborted) return;
      else throw e;
    }
  }
}

/**
 * Abortable sleep function. Cleans everything on all cases preventing leaks
 * On abort throws ErrorAborted
 */
export async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new ErrorAborted());

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let onDone: () => void = () => {};

    const timeout = setTimeout(() => {
      onDone();
      resolve();
    }, ms);
    const onAbort = (): void => {
      onDone();
      reject(new ErrorAborted());
    };
    if (signal) signal.addEventListener("abort", onAbort);

    onDone = (): void => {
      clearTimeout(timeout);
      if (signal) signal.removeEventListener("abort", onAbort);
    };
  });
}

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
export function runOnlyOneSequentially<A, R>(
  fn: (arg?: A) => Promise<R>
): (arg?: A) => void {
  // create a cargo object with an infinite payload
  const cargo = async.cargo(function (
    tasks: { arg: A }[],
    callback: () => void
  ) {
    fn(tasks[0]?.arg)
      .then(() => {
        callback();
      })
      .catch(e => {
        logs.error(
          `WARNING! functions in runOnlyOneSequentially MUST not throw, wrap them in try/catch blocks`,
          e
        );
      });
  },
  1e9);

  return function (arg?: A): void {
    cargo.push({ arg: arg as A });
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
 *
 * @param fn Target function (Callback style)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runOnlyOneReturnToAll<F extends (...args: any[]) => any>(
  f: F
): F {
  return memoize(f, {
    // Wait for Promises to resolve. Do not cache rejections
    promise: true,
    // Return the computed cached result to only waiting calls while the
    // result if being computed. Right as it is resolved, compute it again
    maxAge: 1
  });
}

/**
 * Waits `ms` miliseconds
 *
 * @param ms Pause time (ms)
 */
export function pause(ms: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(resolve, ms);
  });
}
