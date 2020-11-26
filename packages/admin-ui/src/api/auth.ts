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
  | {
      status: "logged-in";
      sessionId: string;
    }
  | {
      status: "not-logged-in";
    }
  | {
      status: "not-registered";
    }
  | {
      status: "error";
      error: Error;
    };

interface LoginReturn {
  sessionId: string;
}

interface RegisterReturn {
  recoveryToken: string;
}

export async function fetchLoginStatus(): Promise<LoginStatus> {
  try {
    const res = await fetch(apiUrls.loginStatus, { method: "POST" });
    const body = await parseResponse<LoginReturn>(res);
    return {
      status: "logged-in",
      sessionId: body.sessionId
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

export async function fetchLogin({
  password
}: {
  password: string;
}): Promise<LoginReturn> {
  const res = await fetch(apiUrls.login, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  return await parseResponse<LoginReturn>(res);
}

export async function fetchLogout(): Promise<LoginReturn> {
  const res = await fetch(apiUrls.login, {
    method: "POST"
  });
  return await parseResponse<LoginReturn>(res);
}

export async function fetchRegister({
  password
}: {
  password: string;
}): Promise<RegisterReturn> {
  const res = await fetch(apiUrls.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
  return await parseResponse(res);
}

export async function fetchChangePass({
  password,
  newPassword
}: {
  password: string;
  newPassword: string;
}): Promise<{ ok: true }> {
  const res = await fetch(apiUrls.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, newPassword })
  });
  return await parseResponse(res);
}

export async function fetchRecoverPass({
  token
}: {
  token: string;
}): Promise<{ ok: true }> {
  const res = await fetch(apiUrls.register, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token })
  });
  return await parseResponse(res);
}
