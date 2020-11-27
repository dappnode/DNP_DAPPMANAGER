import getPublicIpFromUrls from "../utils/getPublicIpFromUrls";

export async function ipPublicGet(): Promise<string> {
  const publicIp = await getPublicIpFromUrls(1000);
  return publicIp;
}
