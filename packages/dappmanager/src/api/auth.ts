import { HttpError, wrapHandler } from "./utils";

// Initial insecure IP auth

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

export const isAdmin = wrapHandler((req, res, next): void => {
  const ip = req.ip;
  if (isAdminIp(ip)) next();
  else
    throw new HttpError(`Requires admin permission. Forbidden ip: ${ip}`, 403);
});

// Cookie auth

const disablePassword = false;
let adminPassword: string | null = null;

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

export const registerAdmin = wrapHandler((req, res) => {
  const password = req.body.password;
  if (!password) throw new HttpError("Missing credentials");

  adminPassword = password;

  res.send({ ok: true });
});

export const changeAdminPassword = wrapHandler((req, res) => {
  const password = req.body.password;
  const newPassword = req.body.newPassword;
  if (!password) throw new HttpError("Missing credentials");
  if (!adminPassword) throw new HttpError("Not registered", 401);
  if (password !== adminPassword) throw new HttpError("Wrong password");

  adminPassword = newPassword;

  res.send({ ok: true });
});

export const loginAdmin = wrapHandler((req, res) => {
  if (!req.session) throw new HttpError("No session");

  const password = req.body.password;
  if (!password) throw new HttpError("Missing credentials");
  if (!adminPassword) throw new HttpError("Not registered", 401);
  if (password !== adminPassword) throw new HttpError("Wrong password");

  req.session.isAdmin = true;
  res.send({ id: req.session.id });
});

export const logoutAdmin = wrapHandler(async (req, res) => {
  if (!req.session) return new HttpError("No session");
  const id = req.session.id;

  await new Promise((resolve, reject) => {
    req.session.destroy(err => (err ? reject(err) : resolve()));
  });

  res.send({ id });
});

export const onlyAdmin = wrapHandler((req, res, next) => {
  if (disablePassword) return next();

  if (!adminPassword) throw new HttpError("Not registered", 401);
  if (!req.session) throw new HttpError("No session");
  if (!req.headers["cookie"]) throw new HttpError("No cookie", 400);

  if (req.session.isAdmin) next();
  else throw new HttpError("Forbidden", 403);
});
