import { Routes } from "../common";

let hostPasswordIsSecureState = false;

export const password: Pick<Routes, "passwordChange" | "passwordIsSecure"> = {
  passwordChange: async () => {
    hostPasswordIsSecureState = true;
  },
  passwordIsSecure: async () => hostPasswordIsSecureState
};
