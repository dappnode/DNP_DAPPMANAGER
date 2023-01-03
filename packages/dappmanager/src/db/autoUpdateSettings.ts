import { dbCache, dbMain } from "./dbFactory";
import {
  AutoUpdateSettings,
  AutoUpdatePending,
  AutoUpdateRegistry
} from "@dappnode/common";

export const AUTO_UPDATE_SETTINGS = "auto-update-settings";
const AUTO_UPDATE_REGISTRY = "auto-update-registry";
const AUTO_UPDATE_PENDING = "auto-update-pending";

// auto-update-settings

export const autoUpdateSettings = dbMain.staticKey<AutoUpdateSettings>(
  AUTO_UPDATE_SETTINGS,
  {}
);

export const autoUpdatePending = dbCache.staticKey<AutoUpdatePending>(
  AUTO_UPDATE_REGISTRY,
  {}
);

export const autoUpdateRegistry = dbCache.staticKey<AutoUpdateRegistry>(
  AUTO_UPDATE_PENDING,
  {}
);
