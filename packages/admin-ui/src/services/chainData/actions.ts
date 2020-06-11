import { createAction } from "@reduxjs/toolkit";
import { ChainData } from "types";

// Service > chainData

export const updateChainData = createAction<ChainData[]>("chainData/update");
