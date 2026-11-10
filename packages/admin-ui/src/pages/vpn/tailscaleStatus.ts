export const tailscaleStatusKey = "tailscale.status";
export const tailscaleStatusMaxAgeSeconds = 90;

const states = ["NoState", "NeedsLogin", "NeedsMachineAuth", "Stopped", "Starting", "Running", "Unavailable"] as const;

export interface TailscaleStatus {
  version: 1;
  state: (typeof states)[number];
  online: boolean;
  authUrl: string | null;
  updatedAt: number;
}

export function validateTailscaleAuthUrl(raw: string): string | null {
  if (raw.length > 512 || !raw.startsWith("https://login.tailscale.com/a/") || /[^\x21-\x7e]|[\\"'<>]/.test(raw))
    return null;

  try {
    const url = new URL(raw);
    if (
      url.protocol !== "https:" ||
      url.hostname !== "login.tailscale.com" ||
      url.username ||
      url.password ||
      url.port ||
      raw.includes("#") ||
      !url.pathname.startsWith("/a/") ||
      url.pathname.length <= 3
    )
      return null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * The package API has no server clock. Assume the admin browser and Dappnode
 * clocks agree within five seconds; fail closed beyond that future skew.
 * Always age the observation timestamp, never the fetch/cache receipt time.
 */
export function parseTailscaleStatus(raw: unknown, nowSeconds = Date.now() / 1000): TailscaleStatus | null {
  if (typeof raw !== "string" || raw.length > 700 || !Number.isFinite(nowSeconds)) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      value.version !== 1 ||
      !states.includes(value.state) ||
      typeof value.online !== "boolean" ||
      (value.authUrl !== null && typeof value.authUrl !== "string") ||
      !Number.isSafeInteger(value.updatedAt) ||
      value.updatedAt <= 0 ||
      value.updatedAt > nowSeconds + 5 ||
      nowSeconds - value.updatedAt > tailscaleStatusMaxAgeSeconds ||
      (value.online && value.state !== "Running") ||
      (typeof value.authUrl === "string" && value.state !== "NeedsLogin")
    )
      return null;

    return {
      version: 1,
      state: value.state,
      online: value.online,
      authUrl: typeof value.authUrl === "string" ? validateTailscaleAuthUrl(value.authUrl) : null,
      updatedAt: value.updatedAt
    };
  } catch {
    return null;
  }
}
