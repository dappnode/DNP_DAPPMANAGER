import path from "path";
import { fileURLToPath } from "url";
import stackTrace from "stack-trace";
// "source-map-support" MUST be imported for stack traces to work properly after Typescript transpile
import "source-map-support/register";
import { logSafeObjects } from "./utils/logs";
import { inspect } from "util";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogArguments = string | Error | { [key: string]: any };
type LogLevel = "debug" | "info" | "warn" | "error";
export type Logs = {
  [P in LogLevel]: (...items: LogArguments[]) => void;
};

// Make NodeJS inspect render deeply nested objects
// Print { b: { d: { f: { h: { i: 'i' } } } } }
// Instead of { b: { d: [ Object ] } }
inspect.defaultOptions.depth = null;

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);
const logDebug = /debug/i.test(process.env.LOG_LEVEL || "");

// Not adding color codes since it makes it harder to read as plain text
const tags = {
  debug: "DEBUG",
  info: "INFO ",
  warn: "WARN ",
  error: "ERROR"
};

/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-console */
export const logs: Logs = {
  /**
   * Allows to log any type of data. Strings will be shown first.
   * ```js
   * logs.debug("some process", ["arg", "arg"], id);
   * ```
   */
  debug: formatLogger(tags.debug, logDebug ? console.debug : (): void => {}),
  /**
   * Allows to log any type of data. Strings will be shown first.
   * ```js
   * logs.info(req.body, "first", [1, 2, 3], "second");
   * ```
   */
  info: formatLogger(tags.info, console.log),
  /**
   * Allows to log any type of data. Strings will be shown first.
   * Use `ErrorNoStack` to hide the stack
   * ```js
   * logs.warn("error fetching", new ErrorNoStack("DAMNN"));
   * ```
   */
  warn: formatLogger(tags.warn, console.warn),
  /**
   * Allows to log any type of data. Strings will be shown first.
   * Use `ErrorNoStack` to hide the stack
   * ```js
   * logs.error("error fetching", new Error("DAMNN"));
   * ```
   */
  error: formatLogger(tags.error, console.error)
};
/* eslint-enable @typescript-eslint/no-empty-function */
/* eslint-enable no-console */

export class ErrorNoStack extends Error {}

function formatLogger(tag: string, logger: (...args: LogArguments[]) => void) {
  return function log(...items: LogArguments[]): void {
    try {
      const caller = getLocation(Error(), 1) || "??";
      const data = items
        // String first
        .sort(function compare(a, b) {
          const aIsString = typeof a === "string";
          const bIsString = typeof b === "string";
          if (aIsString && !bIsString) return -1;
          if (!aIsString && bIsString) return 1;
          return 0;
        })
        // Error last
        .sort(function compare(a, b) {
          const aIsError = a instanceof Error;
          const bIsError = b instanceof Error;
          if (aIsError && !bIsError) return 1;
          if (!aIsError && bIsError) return -1;
          return 0;
        })
        .map(item => {
          if (item instanceof ErrorNoStack) return item.message;
          if (item instanceof Error) return item;
          if (typeof item === "string") return item;
          if (typeof item === "object") return logSafeObjects(item);
          return item;
        });
      logger(tag, `[${caller}]`, ...data);
    } catch (e) {
      /* eslint-disable-next-line no-console */
      console.error("ERROR LOGGING ITEMS", e);
      logger(items);
    }
  };
}

/**
 * Grab the Nth path of the call stack
 * Works well for transpiled, minified or regular code
 * REQUIRES import "source-map-support/register";
 */
export function getLocation(error: Error, stackCount: number): string | null {
  const parsed = stackTrace.parse(error);
  const firstOutsideRow = parsed[stackCount];
  if (!firstOutsideRow) return null;

  const fileName = firstOutsideRow.getFileName();
  const lineNumber = firstOutsideRow.getLineNumber();
  let relativePath = fileName.includes("webpack:")
    ? fileName.replace("/usr/src/app/webpack:/src/", "")
    : path.relative(rootDir, fileName);

  // Don't show unnecessary file info
  if (relativePath.endsWith(".ts")) relativePath = relativePath.slice(0, -3);
  if (relativePath.endsWith("/index")) relativePath = relativePath.slice(0, -6);

  return `${relativePath}:${lineNumber}`;
}
