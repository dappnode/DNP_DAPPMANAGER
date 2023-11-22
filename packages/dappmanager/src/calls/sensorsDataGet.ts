import { Sensors } from "@dappnode/common";
import { sensors } from "@dappnode/hostscriptsservices";

/**
 * Returns the sensors info of the host
 */
export async function sensorsDataGet(): Promise<Sensors> {
    return await sensors();
}