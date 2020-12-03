import { wrapHandler } from "../utils";
import { NotAdminIpError } from "./errors";

// IP auth
// =======
// Legacy auth strategy. Users can connect to DAppNode via WIFI
// or a VPN. Both components have predictable IPs which are
// whitelisted below.
//
// VERY INSECURE => This auth strategy allows for all sort of
// XSS attacks since users are always "logged in" as long as they
// are connected via VPN or WIFI therefore all websites have
// priviledges. The user MUST only use IP auth to register initially
// and then switch to a password + session auth

interface AuthIpParams {
  AUTH_IP_ALLOW_LOCAL_IP: boolean;
}

function isAdminIp(ip: string): boolean {
  return (
    // Admin users connecting from the VPN
    ip.includes("172.33.10.") ||
    // Admin users connecting from the WIFI
    ip.includes("172.33.12.") ||
    // WIFI DNP ip, which may be applied to users in some situations
    ip.includes("172.33.1.10")
  );
}

function isLocalIp(ip: string): boolean {
  // ::1 = IPv6 version of 127.0.0.1
  return ip === "::1" || ip.includes("127.0.0.1");
}

export class AuthIp {
  allowLocal: boolean;

  constructor(params: AuthIpParams) {
    this.allowLocal = params.AUTH_IP_ALLOW_LOCAL_IP;
  }

  onlyAdminIp = wrapHandler((req, res, next): void => {
    const ip = req.ip;
    if (isAdminIp(ip) || (this.allowLocal && isLocalIp(ip))) next();
    else throw new NotAdminIpError();
  });
}
