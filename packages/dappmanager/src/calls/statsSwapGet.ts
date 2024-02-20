import { HostStatSwap } from "@dappnode/types";
import si from "systeminformation";

export async function statsSwapGet(): Promise<HostStatSwap> {
  const swapData = await si.mem();
  return parseSwapStats(swapData);
}

function parseSwapStats(swapData: si.Systeminformation.MemData): HostStatSwap {
  return {
    total: swapData.swaptotal,
    used: swapData.swapused,
    free: swapData.swapfree,
    usedPercentage: (swapData.swapused / swapData.swaptotal) * 100
  };
}
