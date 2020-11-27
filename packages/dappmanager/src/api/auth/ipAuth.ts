import { wrapHandler } from "../utils";
import { NotAdminIpError } from "./errors";

interface AuthIpParams {
  AUTH_IP_ALLOW_ALL_IPS: boolean;
}

// Initial insecure IP auth

// Authorize by IP - INSECURE: use only for first login

const authorizedIpPrefixes = [
  // Admin users connecting from the VPN
  "172.33.10.",
  // Admin users connecting from the WIFI
  "172.33.12.",
  // WIFI DNP ip, which may be applied to users in some situations
  "172.33.1.10"
];

export class AuthIp {
  AUTH_IP_ALLOW_ALL_IPS: boolean;

  constructor(params: AuthIpParams) {
    this.AUTH_IP_ALLOW_ALL_IPS = params.AUTH_IP_ALLOW_ALL_IPS;
    if (params.AUTH_IP_ALLOW_ALL_IPS) console.log(`WARNING! ALLOWING ALL IPFS`);
  }

  onlyAdminIp = wrapHandler((req, res, next): void => {
    const ip = req.ip;
    if (this.isAdminIp(ip)) next();
    else throw new NotAdminIpError();
  });

  private isAdminIp(ip: string): boolean {
    return (
      this.AUTH_IP_ALLOW_ALL_IPS ||
      authorizedIpPrefixes.some(_ip => ip.includes(_ip))
    );
  }
}
