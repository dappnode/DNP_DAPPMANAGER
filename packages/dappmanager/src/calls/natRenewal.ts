import { throttledNatRenewal } from "../daemons/natRenewal/index.js";
import * as db from "../db/index.js";

export async function natRenewalEnable({
  enableNatRenewal
}: {
  enableNatRenewal: boolean;
}): Promise<void> {
  db.isNatRenewalDisabled.set(!enableNatRenewal);

  throttledNatRenewal();
}

export async function natRenewalIsEnabled(): Promise<boolean> {
  return !db.isNatRenewalDisabled.get();
}
