export type LoginStatus =
  | { status: "logged-in"; username: string }
  | { status: "not-logged-in"; noCookie: boolean }
  | { status: "not-registered" }
  | { status: "error"; error: Error };

export interface IApiAuth {
  fetchLoginStatus(): Promise<LoginStatus>;
  login(data: { username: string; password: string }): Promise<{ ok: true }>;
  logoutAndReload(): Promise<void>;
  register(data: {
    username: string;
    password: string;
  }): Promise<{ recoveryToken: string }>;
  changePass(data: {
    password: string;
    newPassword: string;
  }): Promise<{ ok: true }>;
  recoverPass(data: { token: string }): Promise<{ ok: true }>;
}
