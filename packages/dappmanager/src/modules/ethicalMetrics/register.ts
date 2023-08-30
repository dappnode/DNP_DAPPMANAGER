import url from "url";
import { ethicalMetricsEndpoint } from "./params.js";

/**
 * Register the instance in the Ethical Metrics server with the given email
 */
export async function register({
  mail,
  instance
}: {
  mail: string;
  instance: string;
}): Promise<void> {
  if (!mail) throw Error("mail must exist");
  if (!instance) throw Error("instance must exist");

  const response = await fetch(
    url.resolve(ethicalMetricsEndpoint, "/targets"),
    {
      method: "POST",
      body: JSON.stringify({
        instance: instance,
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
