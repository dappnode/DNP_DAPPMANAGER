import * as db from "@dappnode/db";

export async function mirrorProviderSet({ enabled }: { enabled: boolean }): Promise<void> {
  db.mirrorProviderEnabled.set(enabled);
}
