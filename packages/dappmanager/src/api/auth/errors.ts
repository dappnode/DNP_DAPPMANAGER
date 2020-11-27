import { HttpError } from "../utils";

export const ERROR_NOT_REGISTERED = "NOT_REGISTERED";
export const ERROR_NOT_LOGGED_IN = "NOT_LOGGED_IN";

export class NotRegisteredError extends HttpError {
  constructor() {
    super(ERROR_NOT_REGISTERED, 401);
  }
}

export class NotLoggedInError extends HttpError {
  constructor() {
    super(ERROR_NOT_LOGGED_IN, 403);
  }
}
