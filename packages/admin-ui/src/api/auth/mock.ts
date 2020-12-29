import { IApiAuth } from "./interface";

// @ts-ignore
window.mockEnabled = true;
console.warn("Mock mode enabled");
if (window.location.host === "my.dappnode") {
  throw Error("Mock must never be used in production");
}

export const authApi: IApiAuth = {
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
