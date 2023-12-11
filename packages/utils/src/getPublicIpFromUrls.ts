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
        async () => {
          const controller = new AbortController();
          const signal = controller.signal;

          // Set a timeout to abort the fetch
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            const response = await fetch(url, { signal });
            clearTimeout(timeoutId); // Clear timeout on successful fetch
            return await response.text();
          } catch (error) {
            clearTimeout(timeoutId); // Clear timeout on fetch error
            throw error;
          }
        },
        { retries }
      );
      if (isIp(ip)) return ip;
      else throw new Error(`Invalid IP format: ${ip}`);
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }

  throw new Error(`Error fetching public IP\n${errors.join("\n")}`);
}
