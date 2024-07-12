import url from "url";
import { ethicalMetricsEndpoint } from "./params.js";

/**
 * Register the instance in the Ethical Metrics server with the given email
 */
export async function register({
  mail,
  tgChannelId,
}: {
  mail: string | null;
  tgChannelId: string | null;
}): Promise<void> {
  if (!mail && !tgChannelId) throw Error("mail or tgChannelId is required");

  const body: { mail?: string; tgChannelId?: string } = {};
  if (mail) body["mail"] = mail;
  if (tgChannelId) body["tgChannelId"] = tgChannelId;

  const response = await fetch(
    url.resolve(ethicalMetricsEndpoint, "/targets"),
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 200) return;

  const message = await response.text();
  throw Error(`Error registering instance: ${message}`);
}
