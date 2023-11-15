import fetch from "node-fetch";
import isIp from "is-ip";
import retry from "async-retry";

const urls = [
  "https://ns.dappnode.io/myip",
  "http://ipv4.icanhazip.com",
  "http://ident.me",
];

/**
 * Attempts to get an IP from the above list of urls sequentially
 * - If the first link doesn't return a valid IP, the second url is attempted
 * - If all urls have replied invalid IPs, then an error is returned
 *
 * @param silent suppress logs
 * @returns public IP: 85.84.83.82
 */
export async function getPublicIpFromUrls(options?: {
  timeout?: number;
  retries?: number;
}): Promise<string> {
  const timeout = options?.timeout || 15 * 1000;
  const retries = options?.retries || 10;

  const errors = [];
  for (const url of urls) {
    try {
      const ip = await retry(
        () => fetch(url, { timeout }).then((res) => res.text()),
        { retries }
      );
      if (isIp(ip)) return ip;
      else throw Error(`Invalid IP format: ${ip}`);
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  throw Error(`Error fetching public IP\n${errors.join("\n")}`);
}
