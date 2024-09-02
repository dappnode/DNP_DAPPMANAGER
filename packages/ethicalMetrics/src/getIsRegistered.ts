import { ethicalMetricsEndpoint } from "./params.js";
import url from "url";

export async function getIsRegistered({ instance }: { instance: string }): Promise<boolean> {
  return (
    (
      await fetch(url.resolve(ethicalMetricsEndpoint, "/target-by-instance"), {
        method: "POST",
        body: JSON.stringify({
          instance
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })
    ).status === 200
  );
}
