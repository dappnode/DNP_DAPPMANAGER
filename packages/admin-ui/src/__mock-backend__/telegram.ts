import { Routes } from "@dappnode/common";

let isEnabled = false;
let token: string | null = null;

export const telegram: Pick<
  Routes,
  | "telegramStatusGet"
  | "telegramStatusSet"
  | "telegramTokenGet"
  | "telegramTokenSet"
> = {
  telegramStatusGet: async () => isEnabled,
  telegramStatusSet: async ({ telegramStatus }) => {
    isEnabled = telegramStatus;
  },
  telegramTokenGet: async () => token,
  telegramTokenSet: async ({ telegramToken }) => {
    token = telegramToken;
  }
};
