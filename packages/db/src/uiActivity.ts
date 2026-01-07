import { dbCache } from "./dbFactory.js";

const UI_ACTIVITY = "ui-activity";

export interface UiActivityData {
  /** Whether the user is currently active in the UI */
  isActive: boolean;
  /** Timestamp of last user activity in seconds (Unix epoch) */
  lastActivityTimestamp: number;
  /** Timestamp when the session started in seconds (Unix epoch) */
  sessionStartTimestamp: number;
}

const defaultUiActivity: UiActivityData = {
  isActive: false,
  lastActivityTimestamp: 0,
  sessionStartTimestamp: 0
};

export const uiActivity = dbCache.staticKey<UiActivityData>(UI_ACTIVITY, defaultUiActivity);
