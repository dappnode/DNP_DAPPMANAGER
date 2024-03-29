import { Routes } from "@dappnode/types";

let hostPasswordIsSecureState = false;

export const password: Pick<Routes, "passwordChange" | "passwordIsSecure"> = {
  passwordChange: async () => {
    hostPasswordIsSecureState = true;
  },
  passwordIsSecure: async () => hostPasswordIsSecureState
};
