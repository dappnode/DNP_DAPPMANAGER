import bcrypt from "bcryptjs";
import { Request } from "express";
import { PlainTextFileDb } from "../../utils/fileDb";
import { getRandomAlphanumericToken } from "../../utils/token";
import { wrapHandler } from "../utils";
import { SessionsManager } from "../sessions";
import {
  AlreadyRegisteredError,
  MissingCredentialsError,
  NotLoggedInError,
  NotLoggedInNoCookieError,
  NotRegisteredError,
  WrongCredentialsError
} from "./errors";
import { AdminPasswordDb } from "./adminPasswordDb";

// Password & sessions auth
// ========================
// There's one single admin account so no username is used
//
// To register initially the user must have a valid ADMIN IP
// Once registered, the password is set and must be used to
// login all subsequent connections; IP auth is ignored
//
// To recover a lost password the user can:
// A) Use the recoveryToken to set the admin password hash to ""
//    which will start the register cycle again
// B) SSH into the server and delete the ADMIN_PASSWORD_FILE file,
//    which will start the register cycle again

export interface AuthPasswordSessionParams {
  ADMIN_PASSWORD_FILE: string;
  ADMIN_RECOVERY_FILE: string;
  VPN_MAIN_ADMIN_ID: string;
}

const saltLength = 10;
const recoveryTokenLength = 20;

export class AuthPasswordSession {
  sessions: SessionsManager;
  adminPasswordDb: AdminPasswordDb;
  passwordDb: PlainTextFileDb;
  recoveryDb: PlainTextFileDb;
  VPN_MAIN_ADMIN_ID: string;

  constructor(
    sessions: SessionsManager,
    adminPasswordDb: AdminPasswordDb,
    params: AuthPasswordSessionParams
  ) {
    this.sessions = sessions;
    this.adminPasswordDb = adminPasswordDb;
    this.passwordDb = new PlainTextFileDb(params.ADMIN_PASSWORD_FILE);
    this.recoveryDb = new PlainTextFileDb(params.ADMIN_RECOVERY_FILE);
    this.VPN_MAIN_ADMIN_ID = params.VPN_MAIN_ADMIN_ID;
  }

  private assertAdminPassword(password: string): string {
    const passwordHash = this.passwordDb.read();
    if (!password) throw new MissingCredentialsError();
    if (!passwordHash) throw new NotRegisteredError();

    // Check if it's main admin
    if (bcrypt.compareSync(password, passwordHash))
      return this.VPN_MAIN_ADMIN_ID;

    // Check if it's an external admin
    const externalAdminId = this.adminPasswordDb.getIdByPassword(password);
    if (externalAdminId) return externalAdminId;

    throw new WrongCredentialsError();
  }

  private setAdminPassword(password: string): void {
    if (!password) throw new MissingCredentialsError();
    const passwordHash = bcrypt.hashSync(password, saltLength);
    this.passwordDb.write(passwordHash);
  }

  private assertOnlyAdmin(req: Request): void {
    if (!this.passwordDb.read()) throw new NotRegisteredError();

    const sessionData = this.sessions.getSession(req);

    if (
      sessionData &&
      sessionData.isAdmin &&
      sessionData.adminId &&
      (sessionData.adminId === this.VPN_MAIN_ADMIN_ID ||
        // Allows to revoke active sessions when device is deleted
        this.adminPasswordDb.hasAdminId(sessionData.adminId))
    ) {
      // OK
    } else {
      // Sanity check for cookie existance
      if (req.cookies) throw new NotLoggedInError();
      else throw new NotLoggedInNoCookieError();
    }
  }

  /**
   * Write new admin password (hashed) to local DB.
   * Returns the existing or new recovery token
   *
   * Must be authorized via a different mechanism; i.e. via IP
   * Password can only be set if it's un-initialized
   */
  registerAdmin = wrapHandler((req, res) => {
    if (this.passwordDb.read()) throw new AlreadyRegisteredError();
    this.setAdminPassword(req.body.password);

    let recoveryToken = this.recoveryDb.read();
    if (!recoveryToken) {
      recoveryToken = getRandomAlphanumericToken(recoveryTokenLength);
      this.recoveryDb.write(recoveryToken);
    }

    res.send({ recoveryToken });
  });

  /**
   * Validate `password` and set `newPassword`
   */
  changeAdminPassword = wrapHandler((req, res) => {
    const currentPassword = req.body.password;
    const newPassword = req.body.newPassword;
    this.assertAdminPassword(currentPassword);
    this.setAdminPassword(newPassword);

    res.send({ ok: true });
  });

  /**
   * If `token` is correct delete record of hashed admin password
   */
  recoverAdminPassword = wrapHandler((req, res) => {
    const recoveryToken = this.recoveryDb.read();
    if (!req.body.token) throw new MissingCredentialsError();
    if (req.body.token !== recoveryToken) throw new WrongCredentialsError();
    this.passwordDb.del();

    res.send({ ok: true });
  });

  /**
   * Check if user login status is
   * - `NOT_REGISTERED`
   * - `NOT_LOGGED_IN`
   * - ok: logged in
   */
  loginAdminStatus = wrapHandler((req, res) => {
    this.assertOnlyAdmin(req);
    res.send({ ok: true });
  });

  /**
   * Login session if `password` is correct
   * Figure out which admin account this is based on the password used
   * Persist the admin username / ID in the cookie to revoke access
   * When the device gets removed, do not allow that device ID if it's
   * not available locally
   */
  loginAdmin = wrapHandler((req, res) => {
    const adminId = this.assertAdminPassword(req.body.password);

    this.sessions.setSession(req, {
      isAdmin: true,
      adminId
    });

    res.send({ ok: true });
  });

  /**
   * Destroy current session
   */
  logoutAdmin = wrapHandler(async (req, res) => {
    await this.sessions.destroy(req);
    res.send({ ok: true });
  });

  /**
   * Middleware to protect routes only for admin sessions
   */
  onlyAdmin = wrapHandler((req, res, next) => {
    this.assertOnlyAdmin(req);
    next();
  });
}
