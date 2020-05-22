import fetch from "node-fetch";
import isIp from "is-ip";
import { runWithRetry } from "./asyncFlows";

const urls = [
  "https://ns.dappnode.io/myip",
  "http://ipv4.icanhazip.com",
  "http://ident.me"
];

const fetchTextRetry = runWithRetry(
  (url: string) => fetch(url, { timeout: 15 * 1000 }).then(res => res.text()),
  { times: 3 }
);

/**
 * Attempts to get an IP from the above list of urls sequentially
 * - If the first link doesn't return a valid IP, the second url is attempted
 * - If all urls have replied invalid IPs, then an error is returned
 *
 * @param {Boolean} silent suppress logs
 * @return {String} public IP: 85.84.83.82
 */
export default async function getPublicIpFromUrls(): Promise<string> {
  const errors = [];
  for (const url of urls) {
    try {
      const ip = await fetchTextRetry(url);
      if (isIp(ip)) return ip;
      else throw Error(`Invalid IP format: ${ip}`);
    } catch (e) {
      const error = `Error getting IP from ${url}: ${e.message}`;
      errors.push(error);
    }
  }
  throw Error(`No valid IP was returned by urls:\n${errors.join("\n")}`);
}
