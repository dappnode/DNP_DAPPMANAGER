import * as db from "@dappnode/db";

export async function mirrorProviderSet({ enabled }: { enabled: boolean }): Promise<void> {
  if (enabled)
    throw new Error("The unverified content mirror is deprecated. Use an IPFS gateway serving verified DAG/CAR data.");
  db.mirrorProviderEnabled.set(false);
}
