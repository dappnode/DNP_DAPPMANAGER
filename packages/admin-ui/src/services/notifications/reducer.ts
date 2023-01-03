import { mapValues } from "lodash-es";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PackageNotificationDb, PackageNotification } from "@dappnode/common";

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
        timestamp: Date.now(),
        viewed: false,
        ...action.payload
      }
    })
  }
});

export const reducer = notificationsSlice.reducer;
