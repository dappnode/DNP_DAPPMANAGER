import { shell } from "./shell.js";

function ignoreErrors<A, R>(fn: (arg: A) => R) {
  return async function(arg: A): Promise<R | undefined> {
    try {
      return await fn(arg);
    } catch (e) {
      // Ignore
    }
  };
}

export const shellSafe = ignoreErrors(shell);
