import { LoginStatusReturn } from "@dappnode/common";
import {
  apiTestMode,
  apiUrls,
  ERROR_NOT_LOGGED_IN,
  ERROR_NOT_LOGGED_IN_NO_COOKIE,
  ERROR_NOT_REGISTERED
} from "../params";
import { IApiAuth } from "./interface";

export const apiAuth: IApiAuth = {
  async fetchLoginStatus() {
    try {
      const res = await fetchAuthPost<{}, LoginStatusReturn>(
        apiUrls.loginStatus
      );
      return { status: "logged-in", username: res.username };
    } catch (e) {
      switch (e.message) {
        case ERROR_NOT_REGISTERED:
          return { status: "not-registered" };
        case ERROR_NOT_LOGGED_IN:
          return { status: "not-logged-in", noCookie: false };
        case ERROR_NOT_LOGGED_IN_NO_COOKIE:
          return { status: "not-logged-in", noCookie: true };
        default:
          return { status: "error", error: e };
      }
    }
  },

  async login(data) {
    return await fetchAuthPost(apiUrls.login, data);
  },

  async logoutAndReload() {
    await fetchAuthPost(apiUrls.logout);
    window.location.reload();
  },

  async register(data) {
    return await fetchAuthPost(apiUrls.register, data);
  },

  async changePass(data) {
    return await fetchAuthPost(apiUrls.changePass, data);
  },

  async recoverPass(data) {
    return await fetchAuthPost(apiUrls.recoverPass, data);
  }
};

// Utils
////////

async function fetchAuthPost<T, R>(url: string, data?: T): Promise<R> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
    credentials: apiTestMode ? "include" : undefined
  });
  return await parseResponse(res);
}

interface ResponseBody {
  error?: {
    message: string;
  };
}

async function parseBodyErrorMessage(res: Response): Promise<string> {
  const bodyText = await res.text();
  try {
    const body: ResponseBody = JSON.parse(bodyText);
    if (body.error?.message) {
      return body.error?.message;
    } else if (typeof body.error === "string") {
      return body.error;
    } else {
      return bodyText;
    }
  } catch (e) {
    return bodyText;
  }
}

async function parseBodyResult<T>(res: Response): Promise<T> {
  const bodyText = await res.text();
  try {
    return JSON.parse(bodyText);
  } catch (e) {
    throw Error(`Error parsing body: ${e.message}\n${bodyText}`);
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    return await parseBodyResult(res);
  } else {
    // Try to parse error message in body
    const bodyErrorMessage = await parseBodyErrorMessage(res);
    throw Error(bodyErrorMessage || res.statusText);
  }
}
