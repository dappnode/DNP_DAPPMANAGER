import { throttledNatRenewal } from "../daemons/natRenewal";
import * as db from "../db";

export async function natRenewalEnable({
  enableNatRenewal
}: {
  enableNatRenewal: boolean;
}): Promise<void> {
  db.isNatRenewalDisabled.set(!enableNatRenewal);
  if (enableNatRenewal) {
    throttledNatRenewal();
  }
}

export async function natRenewalStatusGet(): Promise<boolean> {
  return !db.isNatRenewalDisabled.get();
}
