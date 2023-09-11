import url from "url";
import { ethicalMetricsEndpoint } from "./params.js";

/**
 * Register the instance in the Ethical Metrics server with the given email
 */
export async function register({ mail }: { mail: string }): Promise<void> {
  if (!mail) throw Error("mail must exist");

  const response = await fetch(
    url.resolve(ethicalMetricsEndpoint, "/targets"),
    {
      method: "POST",
      body: JSON.stringify({
        mail: mail
      }),
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  if (response.status === 200) return;

  const message = await response.text();
  throw Error(`Error registering instance: ${message}`);
}
