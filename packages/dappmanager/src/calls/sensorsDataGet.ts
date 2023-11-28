import { getCpuTemperature } from "@dappnode/hostscriptsservices";
import { logs } from "@dappnode/logger";

/**
 * Returns the sensors info of the host
 */
export async function sensorsDataGet(): Promise<number | null> {
  try {
    return await getCpuTemperature();
  } catch (e) {
    logs.warn(`Unable to get cpu temperature from the host: ${e}`);
    return null;
  }
}
