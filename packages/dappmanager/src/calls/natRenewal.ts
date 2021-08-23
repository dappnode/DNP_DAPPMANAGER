import { throttledNatRenewal } from "../daemons/natRenewal";
import * as db from "../db";

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
