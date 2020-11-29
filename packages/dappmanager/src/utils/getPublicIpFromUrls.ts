import fetch from "node-fetch";
import isIp from "is-ip";
import retry from "async-retry";

const urls = [
  "https://ns.dappnode.io/myip",
  "http://ipv4.icanhazip.com",
  "http://ident.me"
];

/**
 * Attempts to get an IP from the above list of urls sequentially
 * - If the first link doesn't return a valid IP, the second url is attempted
 * - If all urls have replied invalid IPs, then an error is returned
 *
 * @param silent suppress logs
 * @returns public IP: 85.84.83.82
 */
export default async function getPublicIpFromUrls({
  timeout = 15 * 1000,
  retries = 10
}: {
  timeout?: number;
  retries?: number;
}): Promise<string> {
  const errors = [];
  for (const url of urls) {
    try {
      const ip = await retry(
        () => fetch(url, { timeout: timeout }).then(res => res.text()),
        { retries: retries }
      );
      if (isIp(ip)) return ip;
      else throw Error(`Invalid IP format: ${ip}`);
    } catch (e) {
      const error = `Error getting IP from ${url}: ${e.message}`;
      errors.push(error);
    }
  }
  throw Error(`No valid IP was returned by urls:\n${errors.join("\n")}`);
}
