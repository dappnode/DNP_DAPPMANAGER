import { setStaticIP } from "@dappnode/hostscriptsservices"

/**
 * Returns the cpu use percentage in string
 */
export async function setStaticLocalIp(IpAddress: string): Promise<void> {
    await setStaticIP(IpAddress);
  }