import { shellHost } from "@dappnode/utils";


/**
 * returns the local static ip adress
 */
export async function getLocalIpAddress(): Promise<void> {
  const command = "ip -o -f inet addr show $interface | awk '{split($4, a, \"/\"); print a[1]}'"
  await shellHost(command);
}