import bcrypt from "bcryptjs";
import { JsonFileDb } from "../../utils/fileDb";
import { getRandomAlphanumericToken } from "../../utils/token";

const passwordLength = 16;
const recoveryTokenLength = 20;
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

export interface AdminPasswordDbParams {
  ADMIN_PASSWORDS_JSON_FILE: string;
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
  jsonDb: JsonFileDb<PasswordByIdMap>;
  adminStatusDb: Map<string, boolean>;

  constructor(params: AdminPasswordDbParams) {
    this.jsonDb = new JsonFileDb(params.ADMIN_PASSWORDS_JSON_FILE);
    this.adminStatusDb = new Map();
  }

  changePassword(id: string, prevPassword: string, newPassword: string): void {
    const passwordMap = this.read();

    // Validate password
    const prevHash = passwordMap[id];
    if (!prevHash) {
      throw Error("NOT_REGISTERED");
    }
    if (!isValidPassword(prevPassword, prevHash)) {
      throw Error("WRONG_PASSWORD");
    }

    // Hash password and store
    const newHash = bcrypt.hashSync(newPassword, difficultyFactor);
    passwordMap[id] = newHash;

    this.write(passwordMap);
  }

  generateLoginToken(id: string): string {
    const passwordMap = this.read();

    // If registered, return token if password has not changed
    const hash = passwordMap[id];
    if (hash) {
      const loginToken = parseLoginToken(hash);
      if (loginToken == null) throw Error("PASSWORD_CHANGED");
      return loginToken;
    }

    // If not registered generate and write token
    const loginToken = getRandomAlphanumericToken(passwordLength);
    passwordMap[id] = stringifyLoginToken(loginToken);
    this.write(passwordMap);
    return loginToken;
  }

  isValidPassword(id: string, password: string): boolean {
    const passwordMap = this.read();
    const hash = passwordMap[id];

    return isValidPassword(password, hash);
  }

  getIdByPassword(password: string): string | null {
    const passwordMap = this.read();
    for (const [adminId, _password] of Object.entries(passwordMap)) {
      if (password === _password) return adminId;
    }
    return null;
  }

  hasAdminId(id: string): boolean {
    const passwordMap = this.read();
    return Boolean(passwordMap[id]);
  }

  setIsAdmin(id: string, isAdmin: boolean): void {
    this.adminStatusDb.set(id, isAdmin);
  }

  isAdmin(id: string): boolean {
    return this.adminStatusDb.get(id) ?? false;
  }

  removePasswordById(id: string): void {
    const passwordMap = this.read();
    delete passwordMap[id];
    this.write(passwordMap);
  }

  private read(): PasswordByIdMap {
    return this.jsonDb.read() || {};
  }

  private write(passwordMap: PasswordByIdMap): void {
    this.jsonDb.write(passwordMap);
  }
}
