import { dbCache, dbMain } from "./dbFactory";
import {
  AutoUpdateSettings,
  AutoUpdatePending,
  AutoUpdateRegistry
} from "../types";
import { dbKeys } from "./dbUtils";

// auto-update-settings

export const autoUpdateSettings = dbMain.staticKey<AutoUpdateSettings>(
  dbKeys.AUTO_UPDATE_SETTINGS,
  {}
);

export const autoUpdatePending = dbCache.staticKey<AutoUpdatePending>(
  dbKeys.AUTO_UPDATE_REGISTRY,
  {}
);

export const autoUpdateRegistry = dbCache.staticKey<AutoUpdateRegistry>(
  dbKeys.AUTO_UPDATE_PENDING,
  {}
);
