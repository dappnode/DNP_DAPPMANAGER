import { mapValues } from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PackageNotificationDb, PackageNotification } from "common/types";

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {} as {
    [notificationId: string]: PackageNotificationDb;
  },
  reducers: {
    viewedNotifications: state =>
      mapValues(state, n => ({ ...n, viewed: true })),

    pushNotification: (
      state,
      action: PayloadAction<PackageNotificationDb | PackageNotification>
    ) => ({
      ...state,
      [action.payload.id]: {
        id: String(Math.random()).slice(2),
        timestamp: Date.now(),
        viewed: false,
        ...action.payload
      }
    })
  }
});

export const reducer = notificationsSlice.reducer;
