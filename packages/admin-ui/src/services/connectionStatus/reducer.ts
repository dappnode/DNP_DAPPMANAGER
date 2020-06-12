import { createReducer } from "@reduxjs/toolkit";
import { connectionOpen, connectionClose } from "./actions";

// Service > connectionStatus

export const reducer = createReducer<{
  isOpen: boolean;
  isNotAdmin: boolean;
  error: string | null;
}>(
  {
    isOpen: false,
    isNotAdmin: false,
    error: null
  },
  builder => {
    builder.addCase(connectionOpen, () => ({
      isOpen: true,
      error: null,
      isNotAdmin: false
    }));
    builder.addCase(connectionClose, (state, action) => ({
      isOpen: false,
      error: action.payload.error,
      isNotAdmin: action.payload.isNotAdmin
    }));
  }
);
