import { createReducer } from "@reduxjs/toolkit";
import { connectionOpen, connectionClose } from "./actions";

// Service > connectionStatus

export const reducer = createReducer<{
  isOpen: boolean;
  isNotAdmin: boolean;
  notRegistered: boolean;
  error: string | null;
}>(
  {
    isOpen: false,
    isNotAdmin: false,
    notRegistered: false,
    error: null
  },
  builder => {
    builder.addCase(connectionOpen, () => ({
      isOpen: true,
      error: null,
      isNotAdmin: false,
      notRegistered: false
    }));
    builder.addCase(connectionClose, (state, action) => ({
      isOpen: false,
      error: action.payload.error,
      isNotAdmin: action.payload.isNotAdmin,
      notRegistered: action.payload.notRegistered
    }));
  }
);
