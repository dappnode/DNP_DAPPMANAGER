import * as db from "@dappnode/db";
import { dappnodeInstaller } from "../index.js";

export async function mirrorProviderSet({ enabled }: { enabled: boolean }): Promise<void> {
  db.mirrorProviderEnabled.set(enabled);
  dappnodeInstaller.setMirrorEnabled(enabled);
}
