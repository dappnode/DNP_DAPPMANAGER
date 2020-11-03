// timestring does not have a @types package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import timestring from "timestring";

/**
 * Parses a timeout string and returns a number in miliseconds
 * @param timeout "20min", "5000", undefined
 */
export function parseTimeout(
  timeout: number | string | undefined
): number | undefined {
  switch (typeof timeout) {
    case "number": {
      return timeout;
    }
    case "string": {
      if (!timeout) undefined;
      // Timestring returns in seconds
      const parsedString = timestring(timeout) || parseInt(timeout);
      if (!parsedString) throw Error(`Error parsing timeout: ${timeout}`);
      return parsedString * 1000;
    }
    case "undefined":
      return undefined;
    default:
      return undefined;
  }
}
