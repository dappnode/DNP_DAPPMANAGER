import { apiUrls } from "../params";

// Must be in sync with the DAPPMANAGER
const ERROR_NOT_REGISTERED = "NOT_REGISTERED";
const ERROR_NOT_LOGGED_IN = "NOT_LOGGED_IN";

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

export type LoginStatus =
  | { status: "logged-in" }
  | { status: "not-logged-in" }
  | { status: "not-registered" }
  | { status: "error"; error: Error };

export async function fetchLoginStatus(): Promise<LoginStatus> {
  try {
    const res = await fetch(apiUrls.loginStatus, { method: "POST" });
    await parseResponse<{ ok: true }>(res);
    return {
      status: "logged-in"
    };
  } catch (e) {
    switch (e.message) {
      case ERROR_NOT_REGISTERED:
        return {
          status: "not-registered"
        };
      case ERROR_NOT_LOGGED_IN:
        return {
          status: "not-logged-in"
        };
      default:
        return {
          status: "error",
          error: e
        };
    }
  }
}

export async function fetchLogin(data: {
  password: string;
}): Promise<{ ok: true }> {
  return await fetchAuthPost(apiUrls.login, data);
}

export async function fetchLogout(): Promise<{ ok: true }> {
  return await fetchAuthPost(apiUrls.logout);
}

export async function fetchRegister(data: {
  password: string;
}): Promise<{ recoveryToken: string }> {
  return await fetchAuthPost(apiUrls.register, data);
}

export async function fetchChangePass(data: {
  password: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  return await fetchAuthPost(apiUrls.changePass, data);
}

export async function fetchRecoverPass(data: {
  token: string;
}): Promise<{ ok: true }> {
  return await fetchAuthPost(apiUrls.recoverPass, data);
}

async function fetchAuthPost<T, R>(url: string, data?: T): Promise<R> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {})
  });
  return await parseResponse(res);
}
