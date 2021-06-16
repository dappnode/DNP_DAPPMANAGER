import { throttledNatRenewal } from "../daemons/natRenewal";
import * as db from "../db";

export async function upnpPortsOpen({
  enableNatRenewal
}: {
  enableNatRenewal: boolean;
}): Promise<void> {
  if (enableNatRenewal) {
    db.isNatRenewalEnabled.set(true);
    throttledNatRenewal();
  } else {
    db.isNatRenewalEnabled.set(false);
    throttledNatRenewal();
  }
}
