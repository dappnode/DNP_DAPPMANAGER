import { ethicalMetricsEndpoint } from "./params.js";
import url from "url";

/**
 * Unregister the instance in the Ethical Metrics server
 */
export async function unregister({
  instance
}: {
  instance: string;
}): Promise<void> {
  if (!instance) throw Error("instance must exist");

  const response = await fetch(
    url.resolve(ethicalMetricsEndpoint, "/targets"),
    {
      method: "DELETE",
      body: JSON.stringify({
        instance: instance
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (response.status === 200) return;

  const message = await response.json();
  throw Error(`Error deleting instance: ${message}`);
}
