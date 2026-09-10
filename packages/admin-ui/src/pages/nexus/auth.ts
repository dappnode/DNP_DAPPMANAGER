import type { NexusStatus } from "./api";

export const NEXUS_AUTH_CALLBACK_PATH = "/nexus/auth/callback";
export const NEXUS_AUTH_CALLBACK_MESSAGE_TYPE = "dappnode:nexus-auth-callback";

const AUTHGEAR_ENDPOINT = "https://nexus-auth.dappnode.com";
const AUTHGEAR_AUTHORIZE_URL = `${AUTHGEAR_ENDPOINT}/oauth2/authorize`;
const NEXUS_AUTH_LOGIN_URL = "/nexus/auth/login";
// Required until nexus-auth includes Authgear DEV-3545, which fixes access-token
// issuance for authorization-code flows without offline_access.
const NEXUS_AUTH_SCOPE = "openid offline_access";
const NEXUS_AUTH_CALLBACK_URL = `http://my.dappnode${NEXUS_AUTH_CALLBACK_PATH}`;
const NEXUS_AUTH_TIMEOUT_MS = 5 * 60 * 1000;
const NEXUS_AUTH_BACKEND_TIMEOUT_MS = 2 * 60 * 1000;
const NEXUS_AUTH_CLIENT_ID =
  typeof import.meta.env.VITE_NEXUS_AUTH_CLIENT_ID === "string" && import.meta.env.VITE_NEXUS_AUTH_CLIENT_ID
    ? import.meta.env.VITE_NEXUS_AUTH_CLIENT_ID
    : "986265c5bcad52f7";

interface AuthRequest {
  action: NexusAuthAction;
  authorizationUrl: string;
  codeVerifier: string;
  nonce: string;
  redirectUri: string;
  state: string;
}

type NexusAuthAction = "login" | "disconnect";

export interface NexusAuthCallbackMessage {
  type: typeof NEXUS_AUTH_CALLBACK_MESSAGE_TYPE;
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
}

export interface DappnodeNexusLoginResult {
  status: NexusStatus;
  accountLabel: string | null;
}

export async function loginWithDappnodeNexus(): Promise<DappnodeNexusLoginResult> {
  return runDappnodeNexusAuth("login");
}

export async function disconnectDappnodeNexus(): Promise<DappnodeNexusLoginResult> {
  return runDappnodeNexusAuth("disconnect");
}

async function runDappnodeNexusAuth(action: NexusAuthAction): Promise<DappnodeNexusLoginResult> {
  const popup = window.open("about:blank", "dappnode-nexus-auth", buildPopupFeatures());
  if (!popup) throw new Error("The Nexus login popup was blocked. Allow popups for this site and try again.");

  try {
    const request = await createAuthRequest(action);
    const callbackPromise = waitForAuthCallback(popup, request.state, new URL(request.redirectUri).origin);
    popup.location.href = request.authorizationUrl;
    popup.focus();

    const callback = await callbackPromise;
    if (callback.error) throw new Error(formatAuthDeniedError(callback));
    if (!callback.code) throw new Error("Nexus login returned without an authorization code.");

    return await finishDappnodeNexusLogin(callback.code, request);
  } catch (err) {
    if (!popup.closed) popup.close();
    throw err;
  }
}

export function buildNexusAuthCallbackMessage(location: Pick<Location, "search" | "hash">): NexusAuthCallbackMessage {
  const params = readCallbackParams(location);
  const code = params.get("code") || undefined;
  const error = params.get("error") || undefined;
  const errorDescription = params.get("error_description") || undefined;

  return {
    type: NEXUS_AUTH_CALLBACK_MESSAGE_TYPE,
    state: params.get("state") || "",
    ...(code ? { code } : {}),
    ...(error ? { error } : {}),
    ...(errorDescription ? { errorDescription } : {})
  };
}

export function readNexusAuthOpenerOrigin(state: string): string | null {
  try {
    const separator = state.indexOf(".");
    const nonce = state.slice(0, separator);
    if (!/^[A-Za-z0-9_-]{43}$/.test(nonce) || separator === state.length - 1) return null;
    const encodedOrigin = new TextDecoder().decode(base64UrlDecode(state.slice(separator + 1)));
    const url = new URL(encodedOrigin);
    if (url.origin !== encodedOrigin) return null;
    return isAllowedDappmanagerOrigin(url) ? url.origin : null;
  } catch {
    return null;
  }
}

async function createAuthRequest(action: NexusAuthAction): Promise<AuthRequest> {
  const state = `${randomBase64Url(32)}.${base64UrlEncode(new TextEncoder().encode(window.location.origin))}`;
  const nonce = randomBase64Url(32);
  const codeVerifier = randomBase64Url(64);
  const codeChallenge = base64UrlEncode(await sha256Bytes(codeVerifier));
  const redirectUri = NEXUS_AUTH_CALLBACK_URL;
  const url = new URL(AUTHGEAR_AUTHORIZE_URL);

  url.searchParams.set("client_id", NEXUS_AUTH_CLIENT_ID);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", NEXUS_AUTH_SCOPE);
  url.searchParams.set("state", state);
  if (action === "disconnect") url.searchParams.set("prompt", "login");

  return {
    action,
    authorizationUrl: url.toString(),
    codeVerifier,
    nonce,
    redirectUri,
    state
  };
}

function waitForAuthCallback(
  popup: Window,
  expectedState: string,
  expectedCallbackOrigin: string
): Promise<NexusAuthCallbackMessage> {
  return new Promise((resolve, reject) => {
    let closeTimer = 0;
    let timeoutTimer = 0;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      window.clearInterval(closeTimer);
      window.clearTimeout(timeoutTimer);
    };

    const fail = (message: string) => {
      cleanup();
      reject(new Error(message));
    };

    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== popup || !isRecord(event.data)) return;
      if (event.data.type !== NEXUS_AUTH_CALLBACK_MESSAGE_TYPE) return;
      if (event.origin !== expectedCallbackOrigin) {
        fail("Nexus login returned from an unexpected origin.");
        return;
      }
      if (!isNexusAuthCallbackMessage(event.data)) {
        fail("Nexus login returned an invalid message.");
        return;
      }
      if (event.data.state !== expectedState) {
        fail("Nexus login returned an invalid state. Please try again.");
        return;
      }

      cleanup();
      resolve(event.data);
    };

    window.addEventListener("message", onMessage);
    closeTimer = window.setInterval(() => {
      if (popup.closed) fail("Nexus login was closed before it finished.");
    }, 500);
    timeoutTimer = window.setTimeout(() => fail("Nexus login timed out. Please try again."), NEXUS_AUTH_TIMEOUT_MS);
  });
}

async function finishDappnodeNexusLogin(code: string, request: AuthRequest): Promise<DappnodeNexusLoginResult> {
  const { res, json } = await postNexusAuthRequest(code, request);

  if (!res.ok) {
    const message =
      isRecord(json) && isRecord(json.error) && typeof json.error.message === "string"
        ? json.error.message
        : `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  if (!isRecord(json) || !isRecord(json.status)) throw new Error("Nexus login returned an invalid response.");
  return {
    status: json.status as unknown as NexusStatus,
    accountLabel: typeof json.accountLabel === "string" ? json.accountLabel : null
  };
}

async function postNexusAuthRequest(code: string, request: AuthRequest): Promise<{ res: Response; json: unknown }> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), NEXUS_AUTH_BACKEND_TIMEOUT_MS);
  try {
    const res = await fetch(NEXUS_AUTH_LOGIN_URL, {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientId: NEXUS_AUTH_CLIENT_ID,
        action: request.action,
        code,
        codeVerifier: request.codeVerifier,
        nonce: request.nonce,
        redirectUri: request.redirectUri
      }),
      signal: controller.signal
    });
    let json: unknown;
    try {
      json = await res.json();
    } catch (err) {
      if (controller.signal.aborted) throw err;
      json = undefined;
    }
    return { res, json };
  } catch (err) {
    if (controller.signal.aborted) throw new Error("Dappmanager timed out while finishing Nexus login.");
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

function isAllowedDappmanagerOrigin(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  const hostname = url.hostname.toLowerCase();
  if (
    [
      "my.dappnode",
      "my.dappnode.private",
      "dappnode.local",
      "dappmanager.dappnode",
      "dappmanager.dappnode.private",
      "localhost",
      "127.0.0.1",
      "[::1]"
    ].includes(hostname)
  ) {
    return true;
  }
  if (/^pwa\.[a-z0-9-]+\.dyndns\.dappnode\.io$/.test(hostname)) return true;
  return isPrivateIpv4(hostname) || /^\[(?:fc|fd|fe8|fe9|fea|feb)[0-9a-f:]+\]$/.test(hostname);
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function formatAuthDeniedError(callback: NexusAuthCallbackMessage): string {
  if (callback.errorDescription) return callback.errorDescription;
  if (callback.error === "access_denied") return "Nexus login was denied.";
  return `Nexus login failed: ${callback.error}`;
}

function isNexusAuthCallbackMessage(value: unknown): value is NexusAuthCallbackMessage {
  if (!isRecord(value)) return false;
  return (
    value.type === NEXUS_AUTH_CALLBACK_MESSAGE_TYPE &&
    typeof value.state === "string" &&
    (typeof value.code === "string" || typeof value.error === "string") &&
    (value.errorDescription === undefined || typeof value.errorDescription === "string")
  );
}

function readCallbackParams(location: Pick<Location, "search" | "hash">): URLSearchParams {
  const params = new URLSearchParams(location.search);
  const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
  const fragmentParams = new URLSearchParams(hash);
  fragmentParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });
  return params;
}

function buildPopupFeatures(): string {
  const width = 520;
  const height = 720;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  return [
    "popup=yes",
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
    "resizable=yes",
    "scrollbars=yes"
  ].join(",");
}

function randomBase64Url(bytes: number): string {
  if (!window.crypto?.getRandomValues) throw new Error("Nexus login requires browser cryptography support.");
  const random = new Uint8Array(bytes);
  window.crypto.getRandomValues(random);
  return base64UrlEncode(random);
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  if (window.crypto?.subtle) {
    const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return new Uint8Array(digest);
  }
  return sha256(value);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let value = "";
  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });
  return window.btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const decoded = window.atob(base64);
  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98,
  0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8,
  0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
  0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256(input: string): Uint8Array {
  const bytes = new TextEncoder().encode(input);
  const bitLength = bytes.length * 8;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const data = new Uint8Array(paddedLength);
  const view = new DataView(data.buffer);
  const hash = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ]);
  const words = new Uint32Array(64);

  data.set(bytes);
  data[bytes.length] = 0x80;
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotateRight(words[i - 15], 7) ^ rotateRight(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rotateRight(words[i - 2], 17) ^ rotateRight(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let i = 0; i < 64; i++) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + SHA256_K[i] + words[i]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  const digest = new Uint8Array(32);
  const digestView = new DataView(digest.buffer);
  hash.forEach((word, index) => digestView.setUint32(index * 4, word, false));
  return digest;
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}
