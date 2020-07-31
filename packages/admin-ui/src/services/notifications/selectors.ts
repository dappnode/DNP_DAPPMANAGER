import { RootState } from "rootReducer";

// Service > notifications

export const getNotifications = (state: RootState) =>
  Object.values(state.notifications);
