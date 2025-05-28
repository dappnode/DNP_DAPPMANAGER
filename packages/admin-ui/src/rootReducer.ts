import { combineReducers } from "redux";

// Reducers
import { reducer as coreUpdate } from "services/coreUpdate/reducer";
import { reducer as dappnodeStatus } from "services/dappnodeStatus/reducer";
import { reducer as dnpDirectory } from "services/dnpDirectory/reducer";
import { reducer as dnpRegistry } from "services/dnpRegistry/reducer";
import { reducer as dnpInstalled } from "services/dnpInstalled/reducer";
import { reducer as isInstallingLogs } from "services/isInstallingLogs/reducer";

export const rootReducer = combineReducers({
  coreUpdate,
  dappnodeStatus,
  dnpDirectory,
  dnpRegistry,
  dnpInstalled,
  isInstallingLogs,
});

export type RootState = ReturnType<typeof rootReducer>;
