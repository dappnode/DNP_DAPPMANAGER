import { getCpuTemperature } from "@dappnode/hostscriptsservices";

/**
 * Returns the sensors info of the host
 */
export async function sensorsDataGet(): Promise<number> {
  return await getCpuTemperature();
}
