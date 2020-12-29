import { IApiAuth } from "./interface";
import * as real from "./real";
export * from "./interface";

const authApiPromise = process.env.REACT_APP_MOCK ? import("./mock") : real;

export const authApi: IApiAuth = {
  async fetchLoginStatus() {
    return (await authApiPromise).authApi.fetchLoginStatus();
  },
  async login(data) {
    return (await authApiPromise).authApi.login(data);
  },
  async logoutAndReload() {
    return (await authApiPromise).authApi.logoutAndReload();
  },
  async register(data) {
    return (await authApiPromise).authApi.register(data);
  },
  async changePass(data) {
    return (await authApiPromise).authApi.changePass(data);
  },
  async recoverPass(data) {
    return (await authApiPromise).authApi.recoverPass(data);
  }
};
