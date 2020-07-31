import { omit, omitBy } from "lodash";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { stripVersion } from "./utils";

// Service > isInstallingLogs

interface IsInstallingLogsState {
  logs: {
    [logId: string]: {
      [dnpName: string]: string; // Log: "Downloading 57%"
    };
  };
  dnpNameToLogId: {
    [dnpName: string]: string; // logId
  };
}

export const isInstallingLogsSlice = createSlice({
  name: "isInstallingLogs",
  initialState: { logs: {}, dnpNameToLogId: {} } as IsInstallingLogsState,
  reducers: {
    updateIsInstallingLog: (
      state,
      action: PayloadAction<{ id: string; dnpName: string; log: string }>
    ) => {
      const id = stripVersion(action.payload.id);
      const dnpName = stripVersion(action.payload.dnpName);
      const log = action.payload.log;
      const prevId = state.dnpNameToLogId[dnpName];
      const removePrevId = prevId && id !== prevId;
      // If there is a double installation, prevent the install log to update
      // Otherwise there could be confusing messages on the UI, which will display both

      return {
        logs: {
          ...(removePrevId ? omit(state.logs, prevId) : state.logs),
          [id]: { ...(state.logs[id] || {}), [dnpName]: log }
        },
        dnpNameToLogId: { ...state.dnpNameToLogId, [dnpName]: id }
      };
    },

    clearIsInstallingLog: (state, action: PayloadAction<{ id: string }>) => {
      const id = stripVersion(action.payload.id);
      return {
        ...state,
        logs: omit(state.logs, id),
        dnpNameToLogId: omitBy(state.dnpNameToLogId, _id => _id === id)
      };
    }
  }
});

export const reducer = isInstallingLogsSlice.reducer;
