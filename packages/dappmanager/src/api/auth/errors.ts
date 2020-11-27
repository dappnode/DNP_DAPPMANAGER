import { HttpError } from "../utils";

const ERROR_NOT_ADMIN_IP = "NOT_ADMIN_IP";
const ERROR_NOT_REGISTERED = "NOT_REGISTERED";
const ERROR_NOT_LOGGED_IN = "NOT_LOGGED_IN";

export class NotAdminIpError extends HttpError {
  constructor() {
    super(ERROR_NOT_ADMIN_IP, 401);
  }
}

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
