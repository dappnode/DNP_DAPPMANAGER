import * as db from "@dappnode/db";

export async function mirrorProviderGet(): Promise<{ enabled: boolean }> {
  return { enabled: db.mirrorProviderEnabled.get() };
}
