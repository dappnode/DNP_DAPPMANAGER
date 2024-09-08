import { ethicalMetricsEndpoint } from "./params.js";
import url from "url";

export async function getInstance(): Promise<string> {
  return (
    (
      (await (
        await fetch(url.resolve(ethicalMetricsEndpoint, "/instance"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        })
      )
        // TODO: do better type checking
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .json()) as any
    ).instance
  );
}
