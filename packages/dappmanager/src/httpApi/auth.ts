import express from "express";

const allowAllIps = Boolean(process.env.ALLOW_ALL_IPS);

if (allowAllIps) console.log(`WARNING! ALLOWING ALL IPFS`);

// Authorize by IP

const authorizedIpPrefixes = [
  // Admin users connecting from the VPN
  "172.33.10.",
  // Admin users connecting from the WIFI
  "172.33.12.",
  // WIFI DNP ip, which may be applied to users in some situations
  "172.33.1.10"
];

export function isAdminIp(ip: string): boolean {
  return allowAllIps || authorizedIpPrefixes.some(_ip => ip.includes(_ip));
}

export function isAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const ip = req.ip;
  if (isAdminIp(ip)) next();
  else res.status(403).send(`Requires admin permission. Forbidden ip: ${ip}`);
}
