import { throttledNatRenewal } from "../daemons/natRenewal";

export async function upnpPortsOpen(): Promise<void> {
  throttledNatRenewal();
}
