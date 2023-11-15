import bcrypt from "bcryptjs";
import { JsonFileDb } from "@dappnode/utils";
import { getRandomAlphanumericToken } from "./token.js";

export enum AdminPasswordDbError {
  PASSWORD_CHANGED = "ADMIN_PASSWORD_DB_ERROR_PASSWORD_CHANGED"
}

const passwordLength = 16;
const difficultyFactor = 10;
const loginTokenPrefix = "login-token.";

/**
 * May contain two types of password:
 * 1. A prefixed string with `loginTokenPrefix`: a login token to be compared as raw
 * 2. Other: a bcrypt hash and salt concatenated, to be compared with bcrypt
 *
 * ```json
 * {
 * 	"dappnode_admin": "$2a$10$L1OM5CpPxaEPtkd7/bLY2O8sWpRAFWal6cCTGSr0MlYewbFHxZJha"
 * 	"new-admin": "login-token.nZXV1YPQKKElx42HV6Uo"
 * }
 * ```
 */
interface PasswordByIdMap {
  [id: string]: string; // password token
}

interface AdminStatusById {
  [id: string]: { isAdmin: boolean };
}

export interface AdminPasswordDbParams {
  ADMIN_PASSWORDS_JSON_FILE: string;
  ADMIN_STATUS_JSON_FILE: string;
}

function parseLoginToken(hash: string): string | null {
  if (hash.startsWith(loginTokenPrefix)) {
    return hash.slice(loginTokenPrefix.length);
  } else {
    return null;
  }
}

function stringifyLoginToken(token: string): string {
  return `${loginTokenPrefix}${token}`;
}

function isValidPassword(password: string, hash: string): boolean {
  const loginToken = parseLoginToken(hash);
  if (loginToken != null) {
    return password === loginToken;
  } else {
    return bcrypt.compareSync(password, hash);
  }
}

export class AdminPasswordDb {
  private passwordDb: JsonFileDb<PasswordByIdMap>;
  // NOTE: Requires to be synced with remote VPN DB
  private statusDb: JsonFileDb<AdminStatusById>;

  constructor(params: AdminPasswordDbParams) {
    this.passwordDb = new JsonFileDb(params.ADMIN_PASSWORDS_JSON_FILE, {});
    this.statusDb = new JsonFileDb(params.ADMIN_STATUS_JSON_FILE, {});
  }

  setPassword(id: string, newPassword: string): void {
    const passwordMap = this.passwordDb.read();

    // Hash password and store
    const newHash = bcrypt.hashSync(newPassword, difficultyFactor);
    passwordMap[id] = newHash;

    this.passwordDb.write(passwordMap);
  }

  generateLoginToken(id: string): string {
    const passwordMap = this.passwordDb.read();

    // If registered, return token if password has not changed
    const hash = passwordMap[id];
    if (hash) {
      const loginToken = parseLoginToken(hash);
      if (loginToken == null)
        throw Error(AdminPasswordDbError.PASSWORD_CHANGED);
      return loginToken;
    }

    // If not registered generate and write token
    const loginToken = getRandomAlphanumericToken(passwordLength);
    passwordMap[id] = stringifyLoginToken(loginToken);
    this.passwordDb.write(passwordMap);
    return loginToken;
  }

  isValidPassword(id: string, password: string): boolean {
    const passwordMap = this.passwordDb.read();

    const hash = passwordMap[id];
    if (!hash) throw Error("NOT_REGISTERED");

    return isValidPassword(password, hash);
  }

  hasAdminId(id: string): boolean {
    const passwordMap = this.passwordDb.read();
    return Boolean(passwordMap[id]);
  }

  setIsAdmin(id: string, isAdmin: boolean): void {
    const status = this.statusDb.read();
    status[id] = { isAdmin };
    this.statusDb.write(status);
  }

  isAdmin(id: string): boolean {
    const status = this.statusDb.read();
    return status[id]?.isAdmin ?? false;
  }

  removeId(id: string): void {
    // Remove password
    const passwordMap = this.passwordDb.read() || {};
    delete passwordMap[id];
    this.passwordDb.write(passwordMap);

    // Remove admin status
    const status = this.statusDb.read();
    delete status[id];
    this.statusDb.write(status);
  }

  removeAllPasswords(): void {
    // Remove all passwords
    this.passwordDb.write({});

    // Keep admin statuses
  }

  hasSomePassword(): boolean {
    const passwordMap = this.passwordDb.read();
    return Object.keys(passwordMap).length > 0;
  }
}
