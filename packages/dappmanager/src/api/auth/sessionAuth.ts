import { Request } from "express";
import { PlainTextFileDb } from "../../utils/fileDb";
import { getRandomAlphanumericToken } from "../../utils/token";
import { wrapHandler } from "../utils";
import { SessionData, SessionsManager } from "../sessions";
import { LoginStatusReturn } from "@dappnode/common";
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
  ADMIN_RECOVERY_FILE: string;
}

const recoveryTokenLength = 20;

export class AuthPasswordSession {
  sessions: SessionsManager;
  adminPasswordDb: AdminPasswordDb;
  recoveryDb: PlainTextFileDb;

  constructor(
    sessions: SessionsManager,
    adminPasswordDb: AdminPasswordDb,
    params: AuthPasswordSessionParams
  ) {
    this.sessions = sessions;
    this.adminPasswordDb = adminPasswordDb;
    this.recoveryDb = new PlainTextFileDb(params.ADMIN_RECOVERY_FILE);
  }

  private assertPassword(username: string, password: string): void {
    if (!username || !password) throw new MissingCredentialsError();

    if (!this.adminPasswordDb.isValidPassword(username, password)) {
      throw new WrongCredentialsError();
    }
  }

  /**
   * Check if user login status is ok. It may throw an error if
   *
   * - No user registered yet (for UI/UX) >> NotRegisteredError
   * - Some user registered invalid session >> NotLoggedInError
   * - Some user registered no cookie in req >> NotLoggedInNoCookieError
   */
  private assertOnlyAdmin(req: Request): SessionData {
    if (!this.adminPasswordDb.hasSomePassword()) throw new NotRegisteredError();

    const sessionData = this.sessions.getSession(req);

    if (sessionData && sessionData.isAdmin && sessionData.username) {
      // Allows to revoke active sessions when device is deleted
      // or its status is changed to non-admin
      if (this.adminPasswordDb.isAdmin(sessionData.username)) {
        return sessionData;
      } else {
        throw new NotLoggedInError();
      }
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
   * - Must be authorized via a different mechanism; i.e. via IP
   *   Password can only be set if it's un-initialized
   * - Only works if no other user is registered since it's unsafe
   * - To be able to use this method call recoverAdminPassword()
   */
  registerAdmin = wrapHandler((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) throw new MissingCredentialsError();
    if (this.adminPasswordDb.hasSomePassword())
      throw new AlreadyRegisteredError();

    this.adminPasswordDb.setPassword(username, password);

    // Register username as admin
    this.adminPasswordDb.setIsAdmin(username, true);

    // Create recovery token for main admin only
    let recoveryToken = this.recoveryDb.read();
    if (!recoveryToken) {
      recoveryToken = getRandomAlphanumericToken(recoveryTokenLength);
      this.recoveryDb.write(recoveryToken);
    }

    res.send({ recoveryToken });
  });

  /**
   * Validate `password` and set `newPassword`
   *
   * - Any admin user can change its password
   */
  changeAdminPassword = wrapHandler((req, res) => {
    const prevPassword = req.body.password;
    const newPassword = req.body.newPassword;

    if (!prevPassword || !newPassword) throw new MissingCredentialsError();

    const sessionData = this.assertOnlyAdmin(req);
    const username = sessionData.username;

    this.adminPasswordDb.setPassword(username, newPassword);

    res.send({ ok: true });
  });

  /**
   * If `token` is correct deletes all user's passwords
   *
   * - After recovering, the first user to register can call
   *   registerAdmin() and set a new password without a login token
   */
  recoverAdminPassword = wrapHandler((req, res) => {
    const recoveryToken = this.recoveryDb.read();
    if (!req.body.token) throw new MissingCredentialsError();
    if (req.body.token !== recoveryToken) throw new WrongCredentialsError();

    this.adminPasswordDb.removeAllPasswords();

    res.send({ ok: true });
  });

  /**
   * Returns sessionData if logged in, returns error otherwise
   * @see assertOnlyAdmin for error conditions
   */
  loginAdminStatus = wrapHandler((req, res) => {
    const sessionData = this.assertOnlyAdmin(req);

    // Re-assign to new object to prevent leaking sessionData in the response
    const resData: LoginStatusReturn = {
      isAdmin: sessionData.isAdmin,
      username: sessionData.username
    };
    res.send(resData);
  });

  /**
   * Login session if `username` and `password` is correct
   *
   * - Persist the admin username in the cookie to revoke access
   *   when the device gets removed and admin status revoked
   */
  loginAdmin = wrapHandler((req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    this.assertPassword(username, password);

    this.sessions.setSession(req, { isAdmin: true, username });

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
