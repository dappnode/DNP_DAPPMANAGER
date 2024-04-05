import * as url from "url";
import fetch from "node-fetch";

/**
 * Returns true or false, depending on if api's response returns ok
 */

export async function isApiUp(timeout: number = 1000): Promise<boolean> {
  return new Promise<boolean>(() => {
    setTimeout(async () => {
      const ethicalMetricsEndpoint =
        "http://api-ui.ethical-metrics.dappnode:3000";
      try {
        const response = await fetch(url.resolve(ethicalMetricsEndpoint, "/"), {
          method: "HEAD",
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    }, timeout);
  });
}
