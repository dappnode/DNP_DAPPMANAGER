import { RealTimePublicIp } from "../common";
import * as db from "../db";
import getPublicIpFromUrls from "../utils/getPublicIpFromUrls";

export async function ipPublicGet(): Promise<RealTimePublicIp> {
  return {
    realTimePublicIp: await getPublicIpFromUrls({
      timeout: 3 * 1000,
      retries: 1
    }),
    publicIp: db.publicIp.get(),
    staticIp: db.staticIp.get()
  };
}
