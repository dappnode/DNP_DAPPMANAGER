import { PublicIpResponse } from "@dappnode/common";
import getPublicIpFromUrls from "../utils/getPublicIpFromUrls";

export async function ipPublicGet(): Promise<PublicIpResponse> {
  return {
    publicIp: await getPublicIpFromUrls({
      timeout: 3 * 1000,
      retries: 1
    })
  };
}
