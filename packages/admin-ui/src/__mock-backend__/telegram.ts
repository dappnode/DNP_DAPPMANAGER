import { Routes } from "@dappnode/types";

let isEnabled = false;
let telegramToken: string = "";
let telegramUserId: string = "";

export const telegram: Pick<
  Routes,
  | "telegramStatusGet"
  | "telegramStatusSet"
  | "telegramConfigGet"
  | "telegramConfigSet"
> = {
  telegramStatusGet: async () => isEnabled,
  telegramStatusSet: async ({ telegramStatus }) => {
    isEnabled = telegramStatus;
  },
  telegramConfigGet: async () => {
    return {
      token: telegramToken,
      userId: telegramUserId
    };
  },
  telegramConfigSet: async ({ token, userId }) => {
    telegramToken = token;
    telegramUserId = userId;
  }
};
