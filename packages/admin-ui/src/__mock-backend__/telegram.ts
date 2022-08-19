import { Routes } from "../common";

let isEnabled = false;
let token: string | null = null;

export const telegram: Pick<
  Routes,
  | "telegramStatusGet"
  | "telegramStatusSet"
  | "telegramTokenGet"
  | "telegramTokenSet"
  | "telegramChannelIdWhitelistGet"
  | "telegramChannelIdWhitelistSet"
  | "telegramChannelIdWhitelistRemove"
> = {
  telegramStatusGet: async () => isEnabled,
  telegramStatusSet: async ({ telegramStatus }) => {
    isEnabled = telegramStatus;
  },
  telegramTokenGet: async () => token,
  telegramTokenSet: async ({ telegramToken }) => {
    token = telegramToken;
  },
  telegramChannelIdWhitelistGet: async () => [
    "h4dk49dk3nnckd8",
    "dj3jsd93jdhcy3k"
  ],
  telegramChannelIdWhitelistSet: async ({ channelId }) => {},
  telegramChannelIdWhitelistRemove: async ({ channelId }) => {}
};
