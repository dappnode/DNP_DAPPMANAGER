import bcrypt from "bcryptjs";
import { SingleFileDb } from "../../utils/singleFileDb";
import { getRandomAlphanumericToken } from "../../utils/token";
import { HttpError, wrapHandler } from "../utils";
import { SessionsHandler } from "../sessions";
import { NotLoggedInError, NotRegisteredError } from "./errors";

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

interface AuthPasswordSessionParams {
  ADMIN_PASSWORD_FILE: string;
  ADMIN_RECOVERY_FILE: string;
}

const saltLength = 10;
const recoveryTokenLength = 20;

export class AuthPasswordSession {
  sessions: SessionsHandler;
  passwordDb: SingleFileDb;
  recoveryDb: SingleFileDb;

  constructor(sessions: SessionsHandler, params: AuthPasswordSessionParams) {
    this.sessions = sessions;
    this.passwordDb = new SingleFileDb(params.ADMIN_PASSWORD_FILE);
    this.recoveryDb = new SingleFileDb(params.ADMIN_RECOVERY_FILE);
  }

  private assertAdminPassword(password: string): void {
    const passwordHash = this.passwordDb.read();
    if (!password) throw new HttpError("Missing credentials");
    if (!passwordHash) throw new NotRegisteredError();
    if (!bcrypt.compareSync(password, passwordHash))
      throw new HttpError("Wrong password");
  }

  private setAdminPassword(password: string): void {
    if (!password) throw new HttpError("Missing credentials");
    const passwordHash = bcrypt.hashSync(password, saltLength);
    this.passwordDb.write(passwordHash);
  }

  /**
   * Write new admin password (hashed) to local DB.
   * Returns the existing or new recovery token
   *
   * Must be authorized via a different mechanism; i.e. via IP
   * Password can only be set if it's un-initialized
   */
  registerAdmin = wrapHandler((req, res) => {
    if (this.passwordDb.read()) throw new HttpError("Already registered", 403);
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
    if (!req.body.token) throw new HttpError("Missing credentials");
    if (req.body.token !== recoveryToken) throw new HttpError("Wrong token");
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
    if (!this.passwordDb.read()) throw new NotRegisteredError();
    if (!this.sessions.isAdmin(req)) throw new NotLoggedInError();
    res.send({ ok: true });
  });

  /**
   * Login session if `password` is correct
   */
  loginAdmin = wrapHandler((req, res) => {
    this.assertAdminPassword(req.body.password);
    this.sessions.makeAdmin(req);
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
    if (!this.passwordDb.read()) throw new NotRegisteredError();
    if (!this.sessions.isAdmin(req)) throw new NotLoggedInError();
    next();
  });
}
