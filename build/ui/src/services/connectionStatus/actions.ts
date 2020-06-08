import { createAction } from "@reduxjs/toolkit";

// Service > connectionStatus

export const connectionOpen = createAction("connectionStatus/open");

export const connectionClose = createAction<{
  error: string;
  isNotAdmin: boolean;
}>("connectionStatus/close");
