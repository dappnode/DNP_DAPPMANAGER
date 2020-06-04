import { Action, Reducer } from "redux";
import thunk, { ThunkAction } from "redux-thunk";
import { rootReducer, RootState } from "./rootReducer";
import { configureStore } from "@reduxjs/toolkit";

/**
 * To reduce repetition, you might want to define a reusable AppThunk
 * type once, in your store file, and then use that type whenever
 * you write a thunk:
 */
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export const store = configureStore({
  // ### Todo: Fix type bug: 'state !== state', because state can be undefined
  reducer: rootReducer as Reducer,
  middleware: [thunk],
  devTools: { actionsBlacklist: ["UPDATE_CHAIN_DATA"] }
});

declare global {
  interface Window {
    store: typeof store;
  }
}

window.store = store;
