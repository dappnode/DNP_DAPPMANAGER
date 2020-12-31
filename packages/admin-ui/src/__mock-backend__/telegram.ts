import { Routes } from "../common";

let isEnabled = false;

export const telegram: Pick<
  Routes,
  "getTelegramStatus" | "setTelegramStatus" | "setTelegramToken"
> = {
  getTelegramStatus: async () => isEnabled,
  setTelegramStatus: async ({ telegramStatus }) => {
    isEnabled = telegramStatus;
  },
  setTelegramToken: async () => {}
};
