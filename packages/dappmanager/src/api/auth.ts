import bcrypt from "bcryptjs";
import params from "../params";
import { SingleFileDb } from "../utils/singleFileDb";
import { HttpError, wrapHandler } from "./utils";

// Initial insecure IP auth

const allowAllIps = Boolean(process.env.ALLOW_ALL_IPS);
const saltLength = 10;
const passwordDb = new SingleFileDb(params.ADMIN_PASSWORD_FILE);

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
// ========================
// There's one single admin account so no username is used
//
// To register initially the user must have a valid ADMIN IP
// Once registered, the password is set and must be used to
// login all subsequent connections; IP auth is ignored
//
// To recover a lost password the user must SSH into the server
// and delete the ADMIN_PASSWORD_FILE file, which will start
// the register cycle again

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

function assertAdminPassword(password: string): void {
  const passwordHash = passwordDb.read();
  if (!password) throw new HttpError("Missing credentials");
  if (!passwordHash) throw new HttpError("Not registered", 401);
  if (!bcrypt.compareSync(password, passwordHash))
    throw new HttpError("Wrong password");
}

function setAdminPassword(password: string): void {
  if (!password) throw new HttpError("Missing credentials");
  const passwordHash = bcrypt.hashSync(password, saltLength);
  passwordDb.write(passwordHash);
}

// Must be authorized via a different mechanism; i.e. via IP
// Password can only be set if it's un-initialized
export const registerAdmin = wrapHandler((req, res) => {
  const passwordHash = passwordDb.read();
  if (passwordHash) throw new HttpError("Already registered", 403);
  setAdminPassword(req.body.password);

  res.send({ ok: true });
});

export const changeAdminPassword = wrapHandler((req, res) => {
  const currentPassword = req.body.password;
  const newPassword = req.body.newPassword;
  assertAdminPassword(currentPassword);
  setAdminPassword(newPassword);

  res.send({ ok: true });
});

export const loginAdmin = wrapHandler((req, res) => {
  assertAdminPassword(req.body.password);

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
  const passwordHash = passwordDb.read();
  if (!passwordHash) throw new HttpError("Not registered", 401);
  if (!req.session) throw new HttpError("No session");
  if (!req.headers["cookie"]) throw new HttpError("No cookie", 400);

  if (req.session.isAdmin) next();
  else throw new HttpError("Forbidden", 403);
});
