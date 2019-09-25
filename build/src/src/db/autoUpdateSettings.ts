import { staticKey } from "./lowLevelDb";
import {
  AutoUpdateSettings,
  AutoUpdatePending,
  AutoUpdateRegistry
} from "../types";

const AUTO_UPDATE_SETTINGS = "auto-update-settings";
const AUTO_UPDATE_REGISTRY = "auto-update-registry";
const AUTO_UPDATE_PENDING = "auto-update-pending";

// auto-update-settings

export const autoUpdateSettings = staticKey<AutoUpdateSettings>(
  AUTO_UPDATE_SETTINGS,
  {}
);

export const autoUpdatePending = staticKey<AutoUpdatePending>(
  AUTO_UPDATE_REGISTRY,
  {}
);

export const autoUpdateRegistry = staticKey<AutoUpdateRegistry>(
  AUTO_UPDATE_PENDING,
  {}
);
