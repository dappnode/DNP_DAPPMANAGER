import { logs } from "@dappnode/logger";
import { getPublicIpFromUrls } from "@dappnode/utils";

/**
 * Check whether or not if the dappnode si connected to the internet by fethcing server to get its public ip,
 * will retry 6 times with 3 secons delay
 * TODO: Check what happens if the notification of dappnode connected to the internet has eben send and the user eventually recovered internet connection
 * @returns Whether or not if the dappnode is connected to internet
 */
export async function getIsConnectedToInternet(): Promise<boolean> {
  try {
    await getPublicIpFromUrls({
      timeout: 3 * 1000,
      retries: 6
    });
    return true;
  } catch (error) {
    logs.error(`Error while cheching dappnode Internt connectivity: ${error}`);
    return false;
  }
}
