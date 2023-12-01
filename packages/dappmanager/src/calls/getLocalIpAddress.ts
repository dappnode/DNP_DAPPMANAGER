import { shellHost } from "@dappnode/utils";


/**
 * returns the local static ip adress
 */
export async function getLocalIpAddress(): Promise<string> {
  const command = "ip route get 1 | grep -oP 'src \\K\\S+'"
  return await shellHost(command);
}
