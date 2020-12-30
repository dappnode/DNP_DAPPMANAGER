import { IApiAuth } from "../interface";

export const apiAuth: IApiAuth = {
  async fetchLoginStatus() {
    return { status: "logged-in", username: "admin" };
  },

  async login(data) {
    return { ok: true };
  },

  async logoutAndReload() {
    window.location.reload();
  },

  async register(data) {
    return { recoveryToken: "TEST_TOKEN" };
  },

  async changePass(data) {
    return { ok: true };
  },

  async recoverPass(data) {
    return { ok: true };
  }
};
