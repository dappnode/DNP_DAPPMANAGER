import { createReducer } from "@reduxjs/toolkit";
import { updateChainData } from "./actions";
import { ChainData } from "common/types";

// Service > chainData

export const reducer = createReducer<ChainData[]>([], builder =>
  builder.addCase(updateChainData, (state, action) => action.payload)
);
