import * as url from "url";
import fetch from "node-fetch";
export async function isApiUp(): Promise<boolean> {
  const ethicalMetricsEndpoint = "http://api-ui.ethical-metrics.dappnode:3000";
  try {
    const response = await fetch(url.resolve(ethicalMetricsEndpoint, "/"), {
      method: "HEAD",
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}
