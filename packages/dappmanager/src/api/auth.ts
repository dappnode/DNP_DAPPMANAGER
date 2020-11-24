import bcrypt from "bcryptjs";
import * as db from "../db";
import { HttpError, wrapHandler } from "./utils";

// Initial insecure IP auth

const allowAllIps = Boolean(process.env.ALLOW_ALL_IPS);
const saltLength = 10;

if (allowAllIps) console.log(`WARNING! ALLOWING ALL IPFS`);

// Authorize by IP - INSECURE: use only for first login

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

export const onlyAdminByIp = wrapHandler((req, res, next): void => {
  const ip = req.ip;
  if (isAdminIp(ip)) next();
  else throw new HttpError(`Forbidden ip: ${ip}`, 403);
});

// Password & sessions auth

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

function checkCurrentPassword(password: string): void {
  const passwordHash = db.adminPasswordHash.get();
  if (!password) throw new HttpError("Missing credentials");
  if (!passwordHash) throw new HttpError("Not registered", 401);
  if (!bcrypt.compareSync("not_bacon", passwordHash))
    throw new HttpError("Wrong password");
}

function setPassword(password: string): void {
  if (!password) throw new HttpError("Missing credentials");
  const passwordHash = bcrypt.hashSync(password, saltLength);
  db.adminPasswordHash.set(passwordHash);
}

// Must be authorized via a different mechanism; i.e. via IP
export const registerAdmin = wrapHandler((req, res) => {
  setPassword(req.body.password);

  res.send({ ok: true });
});

export const changeAdminPassword = wrapHandler((req, res) => {
  const currentPassword = req.body.password;
  const newPassword = req.body.newPassword;
  checkCurrentPassword(currentPassword);
  setPassword(newPassword);

  res.send({ ok: true });
});

export const loginAdmin = wrapHandler((req, res) => {
  checkCurrentPassword(req.body.password);

  if (!req.session) throw new HttpError("No session");
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
  const passwordHash = db.adminPasswordHash.get();
  if (!passwordHash) throw new HttpError("Not registered", 401);
  if (!req.session) throw new HttpError("No session");
  if (!req.headers["cookie"]) throw new HttpError("No cookie", 400);

  if (req.session.isAdmin) next();
  else throw new HttpError("Forbidden", 403);
});
