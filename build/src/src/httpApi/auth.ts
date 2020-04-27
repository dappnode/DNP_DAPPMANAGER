import express from "express";

// Authorize by IP

const authorizedIpPrefixes = [
  // Admin users connecting from the VPN
  "172.33.10.",
  // Admin users connecting from the WIFI
  "172.33.12.",
  // WIFI DNP ip, which may be applied to users in some situations
  "172.33.1.10"
];

export function isAuthorized(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const isIpAllowed = authorizedIpPrefixes.some(ip => req.ip.includes(ip));

  if (isIpAllowed) {
    next();
  } else {
    res.status(403).send(`Requires admin permission. Forbidden ip: ${req.ip}`);
  }
}
