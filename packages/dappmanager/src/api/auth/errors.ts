import { HttpError } from "../utils.js";

const ERROR_NOT_REGISTERED = "NOT_REGISTERED";
const ERROR_NOT_LOGGED_IN = "NOT_LOGGED_IN";
const ERROR_NOT_LOGGED_IN_NO_COOKIE = "NOT_LOGGED_IN_NO_COOKIE";
const ERROR_MISSING_CREDENTIALS = "MISSING_CREDENTIALS";
const ERROR_WRONG_CREDENTIALS = "WRONG_CREDENTIALS";
const ERROR_ALREADY_REGISTERED = "ALREADY_REGISTERED";

export class NotRegisteredError extends HttpError {
  constructor() {
    super({ name: ERROR_NOT_REGISTERED, statusCode: 401 });
  }
}

export class NotLoggedInError extends HttpError {
  constructor() {
    super({ name: ERROR_NOT_LOGGED_IN, statusCode: 403 });
  }
}

export class NotLoggedInNoCookieError extends HttpError {
  constructor() {
    super({ name: ERROR_NOT_LOGGED_IN_NO_COOKIE, statusCode: 403 });
  }
}

export class MissingCredentialsError extends HttpError {
  constructor() {
    super({ name: ERROR_MISSING_CREDENTIALS, statusCode: 400 });
  }
}

export class WrongCredentialsError extends HttpError {
  constructor() {
    super({ name: ERROR_WRONG_CREDENTIALS, statusCode: 403 });
  }
}

export class AlreadyRegisteredError extends HttpError {
  constructor() {
    super({ name: ERROR_ALREADY_REGISTERED, statusCode: 401 });
  }
}
