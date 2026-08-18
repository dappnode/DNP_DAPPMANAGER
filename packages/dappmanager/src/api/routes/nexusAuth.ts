import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

const AUTHGEAR_ENDPOINT = "https://nexus-auth.dappnode.com";
const AUTHGEAR_TOKEN_URL = `${AUTHGEAR_ENDPOINT}/oauth2/token`;
const AUTHGEAR_USERINFO_URL = `${AUTHGEAR_ENDPOINT}/oauth2/userinfo`;
const AUTHGEAR_JWKS_URL = `${AUTHGEAR_ENDPOINT}/oauth2/jwks`;
const NEXUS_CONTROL_PLANE_URL = "https://nexus-cp.dappnode.com";
const NEXUS_AUTH_CALLBACK_URL = "http://my.dappnode/nexus/auth/callback";
const NEXUS_AUTH_CLIENT_ID = process.env.NEXUS_AUTH_CLIENT_ID || "986265c5bcad52f7";
const REQUEST_TIMEOUT_MS = 15_000;

const authgearJwks = createRemoteJWKSet(new URL(AUTHGEAR_JWKS_URL), {
  timeoutDuration: REQUEST_TIMEOUT_MS
});

type NexusAuthAction = "login" | "disconnect";

interface NexusAuthInput {
  action?: unknown;
  clientId?: unknown;
  code?: unknown;
  codeVerifier?: unknown;
  nonce?: unknown;
  redirectUri?: unknown;
}

interface ParsedNexusAuthInput {
  action: NexusAuthAction;
  clientId: string;
  code: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
}

interface AuthgearTokenResponse {
  access_token?: unknown;
  id_token?: unknown;
  refresh_token?: unknown;
  error?: unknown;
  error_description?: unknown;
}

interface NexusApiKeyResponse {
  id?: unknown;
  raw_key?: unknown;
  error?: unknown;
  message?: unknown;
}

export interface NexusManagedApiKey {
  id: string;
  accountSub: string;
  accountLabel: string | null;
}

export interface NexusAuthKeyStore<T> {
  getApiKey(): string;
  saveApiKey(rawKey: string): Promise<void>;
  restoreApiKey(rawKey: string): void;
  clearApiKey(): void;
  readStatus(): T;
  getManagedApiKey(): NexusManagedApiKey | null;
  setManagedApiKey(value: NexusManagedApiKey | null): void;
}

export interface NexusAuthDependencies {
  fetch?: typeof fetch;
  jwks?: JWTVerifyGetKey;
}

export class NexusAuthError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
    readonly code = "nexus_auth_failed"
  ) {
    super(message);
    this.name = "NexusAuthError";
  }
}

export async function completeNexusAuth<T>(
  input: NexusAuthInput | undefined,
  keyStore: NexusAuthKeyStore<T>,
  dependencies: NexusAuthDependencies = {}
): Promise<{ status: T; accountLabel: string | null }> {
  const request = parseAuthInput(input);
  const managedApiKey = keyStore.getManagedApiKey();

  if (request.action === "disconnect" && !managedApiKey) {
    throw new NexusAuthError("No Nexus-managed API key is configured.", 409, "nexus_key_not_managed");
  }

  const fetchImpl = dependencies.fetch ?? globalThis.fetch;
  const token = await exchangeAuthorizationCode(request, fetchImpl);
  try {
    const claims = await verifyIdToken(String(token.id_token), request.nonce, dependencies.jwks ?? authgearJwks);
    const accountSub = String(claims.sub);

    if (managedApiKey && managedApiKey.accountSub !== accountSub) {
      throw new NexusAuthError(
        "This key belongs to another Nexus account. Log in with that account to disconnect it first.",
        409,
        "nexus_account_mismatch"
      );
    }

    const accessToken = String(token.access_token);
    if (request.action === "disconnect") {
      await deleteApiKey(accessToken, managedApiKey!.id, fetchImpl);
      keyStore.clearApiKey();
      keyStore.setManagedApiKey(null);
      return { status: keyStore.readStatus(), accountLabel: null };
    }

    const userInfo = await fetchUserInfo(accessToken, fetchImpl);
    if (typeof userInfo.sub === "string" && userInfo.sub !== accountSub) {
      throw new NexusAuthError("Nexus login returned inconsistent account details.", 401, "nexus_invalid_token");
    }

    const accountLabel = readAccountLabel(userInfo, claims);
    const apiKey = await createApiKey(accessToken, fetchImpl);
    const previousApiKey = keyStore.getApiKey();

    try {
      await keyStore.saveApiKey(apiKey.rawKey);
      keyStore.setManagedApiKey({ id: apiKey.id, accountSub, accountLabel });

      const status = keyStore.readStatus();
      if (managedApiKey) await deleteApiKey(accessToken, managedApiKey.id, fetchImpl);
      return { status, accountLabel };
    } catch (err) {
      const rollbackErrors: string[] = [];
      try {
        await deleteApiKey(accessToken, apiKey.id, fetchImpl);
      } catch (cleanupErr) {
        rollbackErrors.push(readUnknownError(cleanupErr, "Failed to revoke the new Nexus API key"));
      }
      try {
        keyStore.restoreApiKey(previousApiKey);
        keyStore.setManagedApiKey(managedApiKey);
      } catch (restoreErr) {
        rollbackErrors.push(readUnknownError(restoreErr, "Failed to restore the previous Nexus API key"));
      }

      const message = readUnknownError(err, "Failed to save the Nexus API key");
      throw new Error(rollbackErrors.length ? `${message}. ${rollbackErrors.join(". ")}` : message);
    }
  } finally {
    if (typeof token.refresh_token === "string" && token.refresh_token) {
      await revokeRefreshToken(token.refresh_token, fetchImpl).catch(() => undefined);
    }
  }
}

export async function verifyIdToken(
  idToken: string,
  nonce: string,
  jwks: JWTVerifyGetKey = authgearJwks
): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      algorithms: ["RS256"],
      audience: NEXUS_AUTH_CLIENT_ID,
      issuer: AUTHGEAR_ENDPOINT
    });
    if (payload.nonce !== nonce) throw new Error("invalid nonce");
    if (typeof payload.sub !== "string" || !payload.sub) throw new Error("missing subject");
    if (typeof payload.exp !== "number") throw new Error("missing expiry");
    return payload;
  } catch {
    throw new NexusAuthError("Nexus login returned an invalid ID token.", 401, "nexus_invalid_token");
  }
}

function parseAuthInput(input: NexusAuthInput | undefined): ParsedNexusAuthInput {
  const action = input?.action;
  if (action !== "login" && action !== "disconnect") {
    throw new NexusAuthError("Nexus login returned an invalid action.", 400, "nexus_invalid_request");
  }

  const clientId = readRequiredString(input?.clientId, "clientId");
  const code = readRequiredString(input?.code, "code");
  const codeVerifier = readRequiredString(input?.codeVerifier, "codeVerifier");
  const nonce = readRequiredString(input?.nonce, "nonce");
  const redirectUri = readRequiredString(input?.redirectUri, "redirectUri");

  if (clientId !== NEXUS_AUTH_CLIENT_ID) throw invalidRequest("Nexus login returned an invalid client ID.");
  if (redirectUri !== NEXUS_AUTH_CALLBACK_URL) throw invalidRequest("Nexus login returned an invalid redirect URI.");
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    throw invalidRequest("Nexus login returned an invalid verifier.");
  }
  return { action, clientId, code, codeVerifier, nonce, redirectUri };
}

async function exchangeAuthorizationCode(
  request: ParsedNexusAuthInput,
  fetchImpl: typeof fetch
): Promise<AuthgearTokenResponse> {
  const body = new URLSearchParams({
    client_id: request.clientId,
    code: request.code,
    code_verifier: request.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: request.redirectUri
  });
  const { res, json } = await fetchJsonWithTimeout(fetchImpl, AUTHGEAR_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const tokenResponse = json as AuthgearTokenResponse | undefined;

  if (!res.ok || tokenResponse?.error) {
    throw new NexusAuthError(
      `Nexus token exchange failed: ${readErrorMessage(tokenResponse) || `${res.status} ${res.statusText}`}`
    );
  }
  if (typeof tokenResponse?.access_token !== "string" || typeof tokenResponse.id_token !== "string") {
    throw new NexusAuthError("Nexus token exchange returned an invalid token response.");
  }
  return tokenResponse;
}

async function fetchUserInfo(accessToken: string, fetchImpl: typeof fetch): Promise<Record<string, unknown>> {
  try {
    const { res, json } = await fetchJsonWithTimeout(fetchImpl, AUTHGEAR_USERINFO_URL, {
      headers: { accept: "application/json", authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return {};
    return isRecord(json) ? json : {};
  } catch {
    return {};
  }
}

async function createApiKey(accessToken: string, fetchImpl: typeof fetch): Promise<{ id: string; rawKey: string }> {
  const { res, json } = await fetchJsonWithTimeout(fetchImpl, `${NEXUS_CONTROL_PLANE_URL}/user/apikeys`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ name: "Dappmanager Chat", pii_mode: "balanced" })
  });
  const apiKeyResponse = json as NexusApiKeyResponse | undefined;

  if (!res.ok) {
    throw new NexusAuthError(
      `Nexus API key creation failed: ${readErrorMessage(apiKeyResponse) || `${res.status} ${res.statusText}`}`
    );
  }
  if (
    typeof apiKeyResponse?.id !== "string" ||
    !apiKeyResponse.id.trim() ||
    typeof apiKeyResponse.raw_key !== "string" ||
    !apiKeyResponse.raw_key.trim()
  ) {
    throw new NexusAuthError("Nexus API key creation returned an invalid key.");
  }
  return { id: apiKeyResponse.id, rawKey: apiKeyResponse.raw_key };
}

async function deleteApiKey(accessToken: string, id: string, fetchImpl: typeof fetch): Promise<void> {
  const { res, json } = await fetchJsonWithTimeout(
    fetchImpl,
    `${NEXUS_CONTROL_PLANE_URL}/user/apikeys/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { authorization: `Bearer ${accessToken}` }
    }
  );
  if (!res.ok && res.status !== 404) {
    throw new NexusAuthError(
      `Nexus API key revocation failed: ${readErrorMessage(json) || `${res.status} ${res.statusText}`}`
    );
  }
}

async function revokeRefreshToken(refreshToken: string, fetchImpl: typeof fetch): Promise<void> {
  await fetchJsonWithTimeout(fetchImpl, `${AUTHGEAR_ENDPOINT}/oauth2/revoke`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: NEXUS_AUTH_CLIENT_ID,
      token: refreshToken,
      token_type_hint: "refresh_token"
    })
  });
}

async function fetchJsonWithTimeout(
  fetchImpl: typeof fetch,
  input: string,
  init: RequestInit
): Promise<{ res: Response; json: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchImpl(input, { ...init, signal: controller.signal });
    const json = await readJson(res);
    if (controller.signal.aborted) throw new NexusAuthError("Nexus request timed out. Please try again.", 504);
    return { res, json };
  } catch (err) {
    if (controller.signal.aborted) throw new NexusAuthError("Nexus request timed out. Please try again.", 504);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function readRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) throw invalidRequest(`Missing Nexus login ${name}.`);
  return value;
}

function invalidRequest(message: string): NexusAuthError {
  return new NexusAuthError(message, 400, "nexus_invalid_request");
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

function readErrorMessage(value: unknown): string {
  if (!isRecord(value)) return "";
  if (typeof value.error_description === "string") return value.error_description;
  if (typeof value.message === "string") return value.message;
  if (typeof value.error === "string") return value.error;
  if (isRecord(value.error) && typeof value.error.message === "string") return value.error.message;
  return "";
}

function readAccountLabel(userInfo: Record<string, unknown>, claims: JWTPayload): string | null {
  for (const source of [userInfo, claims]) {
    for (const key of ["name", "email", "preferred_username", "sub"]) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return null;
}

function readUnknownError(value: unknown, fallback: string): string {
  return value instanceof Error && value.message ? value.message : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
