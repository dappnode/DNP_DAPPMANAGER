import { IApiAuth } from "../interface";

export const apiAuth: IApiAuth = {
  async fetchLoginStatus() {
    return { status: "logged-in", username: "admin" };
  },

  async login() {
    return { ok: true };
  },

  async logoutAndReload() {
    window.location.reload();
  },

  async register() {
    return { recoveryToken: "TEST_TOKEN" };
  },

  async changePass() {
    return { ok: true };
  },

  async recoverPass() {
    return { ok: true };
  }
};
