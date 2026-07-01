import electron from "electron";
import type { BrowserWindow as ElectronBrowserWindow, MenuItemConstructorOptions, NativeImage } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createReadStream, constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import net from "node:net";
import type { Socket } from "node:net";
import path from "node:path";
import httpProxy from "http-proxy";
import { SocksProxyAgent } from "socks-proxy-agent";

const { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, session, shell } = electron;

interface DesktopConfig {
  activeProfileId?: string;
  backendUrl?: string;
  profiles?: DappnodeProfile[];
  wireguardEnabled?: boolean;
}

interface DappnodeProfile {
  avatar: string;
  backendUrl: string;
  createdAt: string;
  id: string;
  name: string;
  updatedAt: string;
  wireguardConfigFile?: string;
  wireguardEnabled: boolean;
}

interface PendingWireguardDevice {
  backendUrl: string;
  device: string;
}

interface DesktopServer {
  backendUrl: string;
  server: http.Server;
  sockets: Set<Socket>;
  tunnel?: TunnelRuntime;
  url: string;
  wireguardConfigPath?: string;
  wireguardEnabled: boolean;
}

interface ConnectionInput {
  backendUrl?: unknown;
  wireguard?: {
    config?: unknown;
    enabled?: unknown;
  };
}

interface AutoWireguardInput {
  avatar?: unknown;
  backendUrl?: unknown;
  name?: unknown;
  password?: unknown;
  profileId?: unknown;
  username?: unknown;
}

interface ConnectionStatus {
  activeProfileId?: string;
  backendUrl: string;
  hasTunnelHelper: boolean;
  hasWireguardConfig: boolean;
  profiles: DappnodeProfile[];
  wireguardEnabled: boolean;
}

interface ProfileConnectionInput extends ConnectionInput {
  avatar?: unknown;
  name?: unknown;
  profileId?: unknown;
}

interface PackageWindowInput {
  iconUrl?: unknown;
  title?: unknown;
  url?: unknown;
}

interface PackageWindowMetadata {
  iconUrl?: string;
  title?: string;
}

interface TunnelRuntime {
  agent: SocksProxyAgent;
  getRecentLogs: () => string;
  process: ChildProcess;
  socksPort: number;
}

interface RpcResponse<T = unknown> {
  error?: {
    code?: number;
    data?: unknown;
    message?: string;
  };
  result?: T;
}

type WireguardConfigScope = "remote" | "local";

type IpcResult<T extends object = Record<never, never>> = ({ ok: true } & T) | { ok: false; error: string };

const distDir = __dirname;
const packageRoot = path.resolve(distDir, "..");
const repoRoot = path.resolve(packageRoot, "../..");
const preloadPath = path.join(packageRoot, "preload.cjs");
const connectionPagePath = path.join(packageRoot, "connect.html");
const defaultAdminUiPath = app.isPackaged
  ? path.join(process.resourcesPath, "admin-ui")
  : path.join(repoRoot, "packages/admin-ui/build");
const appIconPath = path.join(packageRoot, "resources/icon.png");
const tunnelBackendUrl = "http://172.33.1.7";
const backendValidationTimeoutMs = 7_000;
const tunnelStartupTimeoutMs = 8_000;
const wireguardConfigRetryDelayMs = 5_000;
const wireguardConfigTimeoutMs = 10 * 60_000;
const tunnelValidationRetryDelayMs = 5_000;
const tunnelValidationTimeoutMs = 10 * 60_000;
const iconRequestTimeoutMs = 5_000;
const maxIconBytes = 2 * 1024 * 1024;

const dappmanagerHostnames = new Set(["dappmanager.dappnode", "my.dappnode", "dappnode.local", "172.33.1.7"]);

const proxyExactGetPaths = new Set(["/global-envs", "/metrics", "/ping", "/public-packages", "/user-action-logs"]);

const proxyGetPrefixes = [
  "/avatar/",
  "/avatars/",
  "/container-logs/",
  "/download/",
  "/env/",
  "/file-download/",
  "/global-envs/",
  "/ipfs/",
  "/nexus/chat/",
  "/nexus/models",
  "/nexus/status",
  "/package-manifest/",
  "/public-packages/",
  "/socket.io/",
  "/wireguard-config/"
];

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

let mainWindow: ElectronBrowserWindow | null = null;
let desktopServer: DesktopServer | null = null;
const packageWindows = new Set<ElectronBrowserWindow>();

function configPath(): string {
  return path.join(app.getPath("userData"), "desktop-config.json");
}

function pendingWireguardDevicePath(): string {
  return path.join(app.getPath("userData"), "pending-wireguard-device.json");
}

function wireguardConfigPath(): string {
  return path.join(app.getPath("userData"), "wireguard.conf");
}

function wireproxyConfigPath(): string {
  return path.join(app.getPath("userData"), "wireproxy.conf");
}

function profileWireguardConfigDir(): string {
  return path.join(app.getPath("userData"), "wireguard");
}

function getProfileWireguardConfigFile(profileId: string): string {
  return `wireguard/${profileId}.conf`;
}

function createProfileId(): string {
  return `node${randomBytes(8).toString("hex")}`;
}

function isValidProfileId(profileId: string): boolean {
  return /^[a-z0-9_-]{3,64}$/i.test(profileId);
}

function normalizeProfileId(input: unknown): string | undefined {
  const profileId = typeof input === "string" ? input.trim() : "";
  return profileId && isValidProfileId(profileId) ? profileId : undefined;
}

function normalizeProfileName(input: unknown): string {
  const name = typeof input === "string" ? input.trim().replace(/\s+/g, " ") : "";
  if (!name) throw new Error("Give this Dappnode a name.");

  return name.slice(0, 64);
}

function getProfileInitials(name: string): string {
  const words = name
    .replace(/[^a-z0-9\s-]/gi, " ")
    .split(/[\s-]+/)
    .filter(Boolean);

  if (words.length === 0) return "DN";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

function escapeSvgText(input: string): string {
  return input.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

function createProfileAvatarDataUri(name: string, seed: string): string {
  const palettes = [
    ["#0068d8", "#78d5ff", "#f4fbff"],
    ["#0b8f6d", "#59e0b7", "#f0fff9"],
    ["#6b5bff", "#a8ceff", "#f7f5ff"],
    ["#b23b3b", "#ffb199", "#fff6f3"],
    ["#126a7a", "#8ee7f1", "#f1fdff"],
    ["#5f6c1d", "#d2e36b", "#fbfff0"]
  ];
  const palette = palettes[hashString(`${name}:${seed}`) % palettes.length];
  const initials = escapeSvgText(getProfileInitials(name));
  const stripeOffset = hashString(seed) % 48;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${escapeSvgText(name)}">`,
    `<rect width="96" height="96" rx="20" fill="${palette[0]}"/>`,
    `<circle cx="${26 + (stripeOffset % 18)}" cy="24" r="34" fill="${palette[1]}" opacity=".32"/>`,
    `<circle cx="${72 - (stripeOffset % 16)}" cy="76" r="42" fill="${palette[2]}" opacity=".28"/>`,
    `<path d="M12 ${58 + (stripeOffset % 10)} C30 46 44 72 84 ${45 + (stripeOffset % 8)}" fill="none" stroke="${
      palette[1]
    }" stroke-width="8" stroke-linecap="round" opacity=".7"/>`,
    `<text x="48" y="57" text-anchor="middle" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif" font-size="28" font-weight="800" fill="#ffffff">${initials}</text>`,
    `</svg>`
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function normalizeProfileAvatar(input: unknown, name: string, profileId: string): string {
  const avatar = typeof input === "string" ? input.trim() : "";
  if (avatar.startsWith("data:image/svg+xml") && avatar.length < 12_000) return avatar;

  return createProfileAvatarDataUri(name, profileId);
}

function resolveUserDataRelativePath(relativePath: string): string {
  const userDataPath = path.resolve(app.getPath("userData"));
  const resolvedPath = path.resolve(userDataPath, relativePath);

  if (!isPathInside(resolvedPath, userDataPath)) {
    throw new Error("Invalid profile config path.");
  }

  return resolvedPath;
}

function sanitizeWireguardConfigFile(input: unknown, profileId: string, wireguardEnabled: boolean): string | undefined {
  if (typeof input === "string" && input === "wireguard.conf") return input;

  const profileConfigFile = getProfileWireguardConfigFile(profileId);
  if (typeof input === "string" && input === profileConfigFile) return input;

  return wireguardEnabled ? profileConfigFile : undefined;
}

function getWireguardConfigPath(profile?: Pick<DappnodeProfile, "id" | "wireguardConfigFile">): string {
  if (!profile) return wireguardConfigPath();

  return resolveUserDataRelativePath(profile.wireguardConfigFile ?? getProfileWireguardConfigFile(profile.id));
}

function getAdminUiPath(): string {
  return process.env.DAPPNODE_ADMIN_UI_PATH ? path.resolve(process.env.DAPPNODE_ADMIN_UI_PATH) : defaultAdminUiPath;
}

function getWireproxyBinaryPath(): string {
  if (process.env.DAPPNODE_WIREPROXY_PATH) return path.resolve(process.env.DAPPNODE_WIREPROXY_PATH);

  const binaryName = process.platform === "win32" ? "wireproxy.exe" : "wireproxy";
  const platformDir = `${process.platform}-${process.arch}`;
  const bundledRoot = app.isPackaged ? process.resourcesPath : path.join(packageRoot, "vendor");

  return path.join(bundledRoot, "wireproxy", platformDir, binaryName);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseHttpUrl(input: unknown): URL | null {
  if (typeof input !== "string" || !input.trim()) return null;

  try {
    const parsedUrl = new URL(input.trim());
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? parsedUrl : null;
  } catch {
    return null;
  }
}

function isDappnodeLocalHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase();

  return (
    dappmanagerHostnames.has(normalizedHostname) ||
    normalizedHostname.endsWith(".dappnode") ||
    normalizedHostname.endsWith(".dappnode.local") ||
    normalizedHostname.endsWith(".dappnode.private")
  );
}

function isPrivateIpv4Address(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    (parts[0] === 169 && parts[1] === 254)
  );
}

function isLikelyLocalBackendUrl(backendUrl: string): boolean {
  const hostname = new URL(backendUrl).hostname.toLowerCase();

  return hostname === "localhost" || isDappnodeLocalHostname(hostname) || isPrivateIpv4Address(hostname);
}

function isDesktopWireguardDevice(device: string): boolean {
  return /^desktop[a-f0-9]{10}$/i.test(device);
}

function isDappnodePackageUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  return isDappnodeLocalHostname(hostname) && !dappmanagerHostnames.has(hostname);
}

function normalizePackageWindowInput(input: unknown): { metadata: PackageWindowMetadata; url: URL } {
  const packageWindowInput = input as PackageWindowInput;
  const url = parseHttpUrl(packageWindowInput?.url);

  if (!url || !isDappnodePackageUrl(url)) {
    throw new Error("Only Dappnode package URLs can be opened inside the desktop app.");
  }

  return {
    metadata: {
      iconUrl: typeof packageWindowInput.iconUrl === "string" ? packageWindowInput.iconUrl.trim() : undefined,
      title: typeof packageWindowInput.title === "string" ? packageWindowInput.title.trim() : undefined
    },
    url
  };
}

function normalizeAutoWireguardInput(input: unknown): {
  avatar?: unknown;
  backendUrl: string;
  name: string;
  password: string;
  profileId?: string;
  username: string;
} {
  const autoWireguardInput = input as AutoWireguardInput;
  const username = typeof autoWireguardInput?.username === "string" ? autoWireguardInput.username.trim() : "";
  const password = typeof autoWireguardInput?.password === "string" ? autoWireguardInput.password : "";

  if (!username) throw new Error("Enter your Dappmanager username.");
  if (!password) throw new Error("Enter your Dappmanager password.");

  return {
    avatar: autoWireguardInput?.avatar,
    backendUrl: normalizeBackendUrl(autoWireguardInput?.backendUrl),
    name: normalizeProfileName(autoWireguardInput?.name),
    password,
    profileId: normalizeProfileId(autoWireguardInput?.profileId),
    username
  };
}

function createDesktopWireguardDeviceName(): string {
  return `desktop${randomBytes(5).toString("hex")}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getPackageWindowTitle(url: URL, metadata?: PackageWindowMetadata): string {
  if (metadata?.title) return metadata.title;

  const firstHostnamePart = url.hostname.split(".")[0] || url.hostname;
  return firstHostnamePart
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function normalizeBackendUrl(input: unknown): string {
  const rawInput = typeof input === "string" ? input.trim() : "";
  if (!rawInput) throw new Error("Enter the URL of your Dappmanager backend.");

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(rawInput) ? rawInput : `http://${rawInput}`;
  const parsedUrl = new URL(withProtocol);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Use an http:// or https:// backend URL.");
  }

  parsedUrl.username = "";
  parsedUrl.password = "";
  parsedUrl.search = "";
  parsedUrl.hash = "";
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, "");

  return parsedUrl.toString().replace(/\/$/, "");
}

function resolveBackendPath(backendUrl: string, requestPath: string): URL {
  const parsedUrl = new URL(backendUrl);
  const basePath = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname.replace(/\/+$/, "");

  parsedUrl.pathname = `${basePath}${requestPath}`;
  parsedUrl.search = "";
  parsedUrl.hash = "";

  return parsedUrl;
}

function normalizeStoredProfile(input: unknown): DappnodeProfile | null {
  const storedProfile = input as Partial<DappnodeProfile>;
  const profileId = normalizeProfileId(storedProfile?.id);

  if (!profileId || typeof storedProfile?.backendUrl !== "string") return null;

  let backendUrl: string;
  try {
    backendUrl = normalizeBackendUrl(storedProfile.backendUrl);
  } catch {
    return null;
  }

  const name =
    typeof storedProfile.name === "string" && storedProfile.name.trim()
      ? storedProfile.name.trim().replace(/\s+/g, " ").slice(0, 64)
      : "Dappnode";
  const wireguardEnabled = storedProfile.wireguardEnabled === true;
  const createdAt = typeof storedProfile.createdAt === "string" ? storedProfile.createdAt : new Date().toISOString();
  const updatedAt = typeof storedProfile.updatedAt === "string" ? storedProfile.updatedAt : createdAt;
  const wireguardConfigFile = sanitizeWireguardConfigFile(
    storedProfile.wireguardConfigFile,
    profileId,
    wireguardEnabled
  );

  return {
    avatar: normalizeProfileAvatar(storedProfile.avatar, name, profileId),
    backendUrl,
    createdAt,
    id: profileId,
    name,
    updatedAt,
    wireguardConfigFile,
    wireguardEnabled
  };
}

function createLegacyProfile(config: DesktopConfig): DappnodeProfile | null {
  if (typeof config.backendUrl !== "string") return null;

  let backendUrl: string;
  try {
    backendUrl = normalizeBackendUrl(config.backendUrl);
  } catch {
    return null;
  }

  const now = new Date().toISOString();
  const profileId = "legacy-default";
  const name = "My Dappnode";
  const wireguardEnabled = config.wireguardEnabled === true;

  return {
    avatar: createProfileAvatarDataUri(name, profileId),
    backendUrl,
    createdAt: now,
    id: profileId,
    name,
    updatedAt: now,
    wireguardConfigFile: wireguardEnabled ? "wireguard.conf" : undefined,
    wireguardEnabled
  };
}

function getActiveProfile(config: DesktopConfig): DappnodeProfile | undefined {
  return config.profiles?.find((profile) => profile.id === config.activeProfileId) ?? config.profiles?.[0];
}

function createDappnodeProfile(
  config: DesktopConfig,
  input: {
    avatar?: unknown;
    backendUrl: string;
    name: string;
    profileId?: string;
    wireguardEnabled: boolean;
  }
): DappnodeProfile {
  const existingProfile = input.profileId
    ? config.profiles?.find((profile) => profile.id === input.profileId)
    : undefined;
  const profileId = existingProfile?.id ?? input.profileId ?? createProfileId();
  const now = new Date().toISOString();
  const wireguardConfigFile = input.wireguardEnabled
    ? (existingProfile?.wireguardConfigFile ?? getProfileWireguardConfigFile(profileId))
    : existingProfile?.wireguardConfigFile;

  return {
    avatar: normalizeProfileAvatar(input.avatar ?? existingProfile?.avatar, input.name, profileId),
    backendUrl: input.backendUrl,
    createdAt: existingProfile?.createdAt ?? now,
    id: profileId,
    name: input.name,
    updatedAt: now,
    wireguardConfigFile,
    wireguardEnabled: input.wireguardEnabled
  };
}

function upsertProfile(config: DesktopConfig, profile: DappnodeProfile): DesktopConfig {
  const profiles = config.profiles ?? [];
  const profileExists = profiles.some((storedProfile) => storedProfile.id === profile.id);

  return {
    activeProfileId: profile.id,
    profiles: profileExists
      ? profiles.map((storedProfile) => (storedProfile.id === profile.id ? profile : storedProfile))
      : [...profiles, profile]
  };
}

async function readConfigFile(): Promise<DesktopConfig> {
  try {
    const rawConfig = await readFile(configPath(), "utf8");
    const parsedConfig = JSON.parse(rawConfig) as DesktopConfig;
    const profiles = Array.isArray(parsedConfig.profiles)
      ? parsedConfig.profiles
          .map(normalizeStoredProfile)
          .filter((profile): profile is DappnodeProfile => Boolean(profile))
      : [];
    const legacyProfile = profiles.length === 0 ? createLegacyProfile(parsedConfig) : null;
    const normalizedProfiles = legacyProfile ? [legacyProfile] : profiles;
    const activeProfileId = normalizeProfileId(parsedConfig.activeProfileId) ?? normalizedProfiles[0]?.id;
    const activeProfile = normalizedProfiles.find((profile) => profile.id === activeProfileId) ?? normalizedProfiles[0];

    return {
      activeProfileId: activeProfile?.id,
      backendUrl: activeProfile?.backendUrl,
      profiles: normalizedProfiles,
      wireguardEnabled: activeProfile?.wireguardEnabled === true
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function readPendingWireguardDevice(backendUrl: string): Promise<string | undefined> {
  try {
    const rawConfig = await readFile(pendingWireguardDevicePath(), "utf8");
    const pendingDevice = JSON.parse(rawConfig) as PendingWireguardDevice;

    return pendingDevice.backendUrl === backendUrl && /^[a-z0-9]+$/i.test(pendingDevice.device)
      ? pendingDevice.device
      : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeConfigFile(config: DesktopConfig): Promise<void> {
  await mkdir(path.dirname(configPath()), { recursive: true });
  const profiles = config.profiles ?? [];
  const activeProfile = getActiveProfile({ ...config, profiles });
  await writePrivateFile(
    configPath(),
    `${JSON.stringify(
      {
        activeProfileId: activeProfile?.id,
        profiles
      },
      null,
      2
    )}\n`
  );
}

async function writePendingWireguardDevice(config: PendingWireguardDevice): Promise<void> {
  await writePrivateFile(pendingWireguardDevicePath(), `${JSON.stringify(config, null, 2)}\n`);
}

async function writePrivateFile(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, { mode: 0o600 });
}

async function assertAdminUiBuildExists(): Promise<void> {
  const indexPath = path.join(getAdminUiPath(), "index.html");

  try {
    await access(indexPath, fsConstants.R_OK);
  } catch {
    throw new Error(`Admin UI build not found at ${getAdminUiPath()}. Run "yarn workspace @dappnode/admin-ui build".`);
  }
}

async function validateBackendUrl(backendUrl: string, agent?: SocksProxyAgent): Promise<void> {
  const body = "{}";
  const endpoint = resolveBackendPath(backendUrl, "/login-status");
  const response = await requestBackend(endpoint, body, agent);
  const contentType = String(response.headers["content-type"] ?? "");
  const bodyText = response.body.trim();

  if (response.statusCode === 404) {
    throw new Error(`No Dappmanager API was found at ${backendUrl}.`);
  }

  if (bodyText.length > 0) {
    try {
      JSON.parse(bodyText);
    } catch {
      if (contentType.includes("text/html")) {
        throw new Error(`That URL returned a web page, not the Dappmanager API. Check the backend URL.`);
      }
    }
  }
}

function requestBackend(
  endpoint: URL,
  body: string,
  agent?: SocksProxyAgent
): Promise<{ body: string; headers: http.IncomingHttpHeaders; statusCode?: number }> {
  const transport = endpoint.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Length": Buffer.byteLength(body),
          "Content-Type": "application/json"
        },
        agent,
        rejectUnauthorized: false,
        timeout: backendValidationTimeoutMs
      },
      (response) => {
        let responseBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          responseBody += chunk;
        });
        response.on("end", () =>
          resolve({
            body: responseBody,
            headers: response.headers,
            statusCode: response.statusCode
          })
        );
      }
    );

    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error(`Connection to ${endpoint.origin} timed out.`)));
    request.end(body);
  });
}

function requestJson<T>(
  endpoint: URL,
  body: unknown,
  options: { cookie?: string; timeoutMs?: number } = {}
): Promise<{ body: T; headers: http.IncomingHttpHeaders; statusCode?: number }> {
  const transport = endpoint.protocol === "https:" ? https : http;
  const requestBody = JSON.stringify(body ?? {});
  const headers: http.OutgoingHttpHeaders = {
    "Content-Length": Buffer.byteLength(requestBody),
    "Content-Type": "application/json"
  };

  if (options.cookie) headers.Cookie = options.cookie;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      endpoint,
      {
        headers,
        method: "POST",
        rejectUnauthorized: false,
        timeout: options.timeoutMs ?? backendValidationTimeoutMs
      },
      (response) => {
        let responseBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk: string) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          let parsedBody: T;

          try {
            parsedBody = responseBody ? (JSON.parse(responseBody) as T) : ({} as T);
          } catch {
            reject(new Error(responseBody || `Invalid JSON response from ${endpoint.pathname}.`));
            return;
          }

          if (response.statusCode && response.statusCode >= 400) {
            reject(new Error(getResponseErrorMessage(parsedBody, response.statusCode)));
            return;
          }

          resolve({
            body: parsedBody,
            headers: response.headers,
            statusCode: response.statusCode
          });
        });
      }
    );

    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error(`Request to ${endpoint.origin} timed out.`)));
    request.end(requestBody);
  });
}

function getResponseErrorMessage(body: unknown, statusCode: number): string {
  const responseBody = body as { error?: { message?: unknown } | string };

  if (typeof responseBody?.error === "string") return responseBody.error;
  if (typeof responseBody?.error?.message === "string") return responseBody.error.message;

  return `Request failed with HTTP ${statusCode}.`;
}

function getCookieHeader(setCookieHeader: string | string[] | undefined): string {
  const cookies = (Array.isArray(setCookieHeader) ? setCookieHeader : setCookieHeader ? [setCookieHeader] : [])
    .map((cookie) => cookie.split(";")[0])
    .filter(Boolean);

  return cookies.join("; ");
}

async function loginToBackend(backendUrl: string, username: string, password: string): Promise<string> {
  const response = await requestJson<{ ok?: boolean }>(resolveBackendPath(backendUrl, "/login"), {
    password,
    username
  });
  const cookie = getCookieHeader(response.headers["set-cookie"]);

  if (!cookie) throw new Error("Dappmanager login did not return a session cookie.");

  return cookie;
}

async function callBackendRpc<T>(backendUrl: string, cookie: string, method: string, params: unknown[]): Promise<T> {
  const response = await requestJson<RpcResponse<T>>(
    resolveBackendPath(backendUrl, "/rpc"),
    {
      method,
      params
    },
    { cookie, timeoutMs: 30_000 }
  );

  if (response.body.error) {
    throw new Error(response.body.error.message || `Dappmanager RPC failed: ${method}`);
  }

  return response.body.result as T;
}

async function getWireguardDeviceConfigWithRetry(
  backendUrl: string,
  cookie: string,
  device: string,
  isLocal: boolean,
  timeoutMs = wireguardConfigTimeoutMs
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      return await callBackendRpc<string>(backendUrl, cookie, "wireguardDeviceConfigGet", [{ device, isLocal }]);
    } catch (error) {
      lastError = error;
      if (Date.now() + wireguardConfigRetryDelayMs >= deadline) break;
      await delay(wireguardConfigRetryDelayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not fetch the WireGuard config.");
}

async function validateBackendUrlWithRetry(
  backendUrl: string,
  agent: SocksProxyAgent,
  timeoutMs = tunnelValidationTimeoutMs
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await validateBackendUrl(backendUrl, agent);
      return;
    } catch (error) {
      lastError = error;
      if (Date.now() + tunnelValidationRetryDelayMs >= deadline) break;
      await delay(tunnelValidationRetryDelayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Could not reach ${backendUrl} through the tunnel.`);
}

async function applyWireguardConfigAndValidate(config: string, configPathForTunnel: string): Promise<void> {
  let tunnel: TunnelRuntime | undefined;

  try {
    await updateWireguardConfig(config, true, configPathForTunnel);
    tunnel = await startWireguardTunnel(configPathForTunnel);
    await validateBackendUrlWithRetry(tunnelBackendUrl, tunnel.agent);
  } catch (error) {
    throw new Error(formatTunnelValidationError(error, tunnel));
  } finally {
    stopWireguardTunnel(tunnel);
  }
}

function formatWireguardConfigFallbackError(remoteError: unknown, localError: unknown): string {
  return [
    "Could not validate WireGuard with either remote DynDNS or local network credentials.",
    "",
    `Remote credentials: ${getErrorMessage(remoteError)}`,
    "",
    `Local credentials: ${getErrorMessage(localError)}`
  ].join("\n");
}

function getAutoWireguardConfigScopes(backendUrl: string): WireguardConfigScope[] {
  return isLikelyLocalBackendUrl(backendUrl) ? ["local", "remote"] : ["remote", "local"];
}

function formatAutoWireguardSetupError(device: string, error: unknown): string {
  if (!device) return getErrorMessage(error);

  return [
    `Started setup for WireGuard device ${device}, but could not validate the tunnel before the timeout.`,
    "The device was left on Dappnode to avoid triggering another WireGuard reconfiguration.",
    "Try Connect again to keep waiting with the same device.",
    "",
    getErrorMessage(error)
  ].join("\n");
}

function shouldContinueAfterDeviceAddError(error: unknown): boolean {
  const message = getErrorMessage(error);
  const code = (error as NodeJS.ErrnoException)?.code;

  return code === "ECONNRESET" || code === "ETIMEDOUT" || /ECONNRESET|ETIMEDOUT|socket hang up|timeout/i.test(message);
}

async function getReusableDesktopWireguardDevice(backendUrl: string, cookie: string): Promise<string | undefined> {
  const pendingDevice = await readPendingWireguardDevice(backendUrl);
  if (pendingDevice) return pendingDevice;

  const devices = await callBackendRpc<string[]>(backendUrl, cookie, "wireguardDevicesGet", []);
  const desktopDevice = devices.filter(isDesktopWireguardDevice).at(-1);

  if (desktopDevice) await writePendingWireguardDevice({ backendUrl, device: desktopDevice });

  return desktopDevice;
}

async function fetchAndValidateAutoWireguardConfig(
  backendUrl: string,
  cookie: string,
  configPathForTunnel: string,
  device: string,
  scope: WireguardConfigScope
): Promise<void> {
  const config = await getWireguardDeviceConfigWithRetry(backendUrl, cookie, device, scope === "local");
  await applyWireguardConfigAndValidate(config, configPathForTunnel);
}

async function setupWireguardAutomatically(
  input: unknown
): Promise<{ backendUrl: string; configScope: WireguardConfigScope; device: string; profile: DappnodeProfile }> {
  const { avatar, backendUrl, name, password, profileId, username } = normalizeAutoWireguardInput(input);
  const desktopConfig = await readConfigFile();
  const profile = createDappnodeProfile(desktopConfig, {
    avatar,
    backendUrl: tunnelBackendUrl,
    name,
    profileId,
    wireguardEnabled: true
  });
  const configPathForTunnel = getWireguardConfigPath(profile);
  const wireproxyPath = getWireproxyBinaryPath();
  let cookie = "";
  let createdDevice = "";
  let previousWireguardConfig: string | undefined;
  let configScope: WireguardConfigScope = "remote";

  try {
    await assertWireproxyBinaryExists(wireproxyPath);
    await assertAdminUiBuildExists();
    await validateBackendUrl(backendUrl);

    cookie = await loginToBackend(backendUrl, username, password);
    createdDevice = (await getReusableDesktopWireguardDevice(backendUrl, cookie)) || "";
    if (!createdDevice) {
      createdDevice = createDesktopWireguardDeviceName();
      await writePendingWireguardDevice({ backendUrl, device: createdDevice });
      try {
        await callBackendRpc<void>(backendUrl, cookie, "wireguardDeviceAdd", [createdDevice]);
      } catch (error) {
        if (!shouldContinueAfterDeviceAddError(error)) throw error;
        console.warn(
          `WireGuard device add response failed for ${createdDevice}; continuing because the peer may have been created.`,
          error
        );
      }
    }

    previousWireguardConfig = await readFile(configPathForTunnel, "utf8").catch((error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
      throw error;
    });

    let validatedScope: WireguardConfigScope | undefined;
    const errors: Partial<Record<WireguardConfigScope, unknown>> = {};
    for (const scope of getAutoWireguardConfigScopes(backendUrl)) {
      try {
        await fetchAndValidateAutoWireguardConfig(backendUrl, cookie, configPathForTunnel, createdDevice, scope);
        validatedScope = scope;
        break;
      } catch (error) {
        errors[scope] = error;
      }
    }

    if (!validatedScope) {
      throw new Error(formatWireguardConfigFallbackError(errors.remote, errors.local));
    }
    configScope = validatedScope;

    await writeConfigFile(upsertProfile(await readConfigFile(), profile));
    await removeFileIfExists(pendingWireguardDevicePath());
    await loadAdminUi(profile.backendUrl, profile.wireguardEnabled, configPathForTunnel);

    const device = createdDevice;
    createdDevice = "";

    return { backendUrl: profile.backendUrl, configScope, device, profile };
  } catch (error) {
    if (previousWireguardConfig !== undefined) {
      await writePrivateFile(configPathForTunnel, previousWireguardConfig);
    } else {
      await unlink(configPathForTunnel).catch((unlinkError) => {
        if ((unlinkError as NodeJS.ErrnoException).code !== "ENOENT") throw unlinkError;
      });
    }

    throw new Error(formatAutoWireguardSetupError(createdDevice, error));
  }
}

function requestBuffer(endpoint: URL, agent?: SocksProxyAgent, redirectsLeft = 2): Promise<Buffer> {
  const transport = endpoint.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = transport.request(
      endpoint,
      {
        agent,
        method: "GET",
        rejectUnauthorized: false,
        timeout: iconRequestTimeoutMs
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;
        const location = response.headers.location;

        if (statusCode >= 300 && statusCode < 400 && location && redirectsLeft > 0) {
          response.resume();
          requestBuffer(new URL(location, endpoint), agent, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        if (statusCode >= 400) {
          response.resume();
          reject(new Error(`Icon request failed with HTTP ${statusCode}.`));
          return;
        }

        const chunks: Uint8Array[] = [];
        let byteLength = 0;

        response.on("data", (chunk: Buffer) => {
          byteLength += chunk.length;
          if (byteLength > maxIconBytes) {
            request.destroy(new Error("Icon response is too large."));
            return;
          }

          chunks.push(Uint8Array.from(chunk));
        });
        response.on("end", () => resolve(Buffer.concat(chunks, byteLength)));
      }
    );

    request.on("error", reject);
    request.on("timeout", () => request.destroy(new Error(`Icon request to ${endpoint.origin} timed out.`)));
    request.end();
  });
}

async function startDesktopServer(
  backendUrl: string,
  wireguardEnabled: boolean,
  configPathForTunnel?: string
): Promise<string> {
  if (
    desktopServer?.backendUrl === backendUrl &&
    desktopServer.wireguardEnabled === wireguardEnabled &&
    desktopServer.wireguardConfigPath === configPathForTunnel
  ) {
    return desktopServer.url;
  }

  await stopDesktopServer();
  await assertAdminUiBuildExists();

  const tunnel = wireguardEnabled ? await startWireguardTunnel(configPathForTunnel) : undefined;
  const proxy = httpProxy.createProxyServer({
    agent: tunnel?.agent,
    changeOrigin: true,
    proxyTimeout: 60_000,
    secure: false,
    target: backendUrl,
    ws: true
  });

  proxy.on("error", (error, _request, response) => {
    if (!response) return;

    if (isServerResponse(response)) {
      sendJsonError(response, 502, `Could not reach Dappmanager backend: ${getErrorMessage(error)}`);
      return;
    }

    response.destroy();
  });

  const adminUiPath = getAdminUiPath();
  const server = http.createServer((request, response) => {
    if (shouldProxyRequest(request)) {
      proxy.web(request, response);
      return;
    }

    serveAdminUi(request, response, adminUiPath).catch((error) => {
      sendJsonError(response, 500, getErrorMessage(error));
    });
  });
  const sockets = new Set<Socket>();

  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  server.on("upgrade", (request, socket, head) => {
    if (!shouldProxyRequest(request)) {
      socket.destroy();
      return;
    }

    proxy.ws(request, socket, head);
  });

  const url = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();

      if (!address || typeof address === "string") {
        reject(new Error("Could not bind Dappnode desktop server."));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });

  desktopServer = {
    backendUrl,
    server,
    sockets,
    tunnel,
    url,
    wireguardConfigPath: configPathForTunnel,
    wireguardEnabled
  };

  return url;
}

async function stopDesktopServer(): Promise<void> {
  if (!desktopServer) return;

  const { server, sockets, tunnel } = desktopServer;
  desktopServer = null;
  closePackageWindows();

  for (const socket of sockets) socket.destroy();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  stopWireguardTunnel(tunnel);
}

async function startWireguardTunnel(configPathForTunnel = wireguardConfigPath()): Promise<TunnelRuntime> {
  const wireproxyPath = getWireproxyBinaryPath();
  const wireguardPath = configPathForTunnel;

  await assertWireguardConfigExists(wireguardPath);
  await assertWireproxyBinaryExists(wireproxyPath);

  const socksPort = await getFreeLoopbackPort();
  await writePrivateFile(
    wireproxyConfigPath(),
    [`WGConfig = ${wireguardPath}`, "", "[Socks5]", `BindAddress = 127.0.0.1:${socksPort}`, ""].join("\n")
  );

  const child = spawn(wireproxyPath, ["-c", wireproxyConfigPath()], {
    stdio: ["ignore", "pipe", "pipe"]
  });

  let recentLogs = "";
  const appendLog = (chunk: string): void => {
    recentLogs = `${recentLogs}${chunk}`.slice(-4_000);
    if (process.env.ELECTRON_ENABLE_LOGGING || process.env.DAPPNODE_WIREPROXY_LOGS) {
      console.log(chunk.trimEnd());
    }
  };

  child.stdout?.setEncoding("utf8");
  child.stdout?.on("data", appendLog);
  child.stderr?.setEncoding("utf8");
  child.stderr?.on("data", appendLog);

  try {
    await waitForPort("127.0.0.1", socksPort, tunnelStartupTimeoutMs, child, () => recentLogs.trim());
  } catch (error) {
    stopWireguardTunnel({
      agent: new SocksProxyAgent("socks5h://127.0.0.1:1"),
      getRecentLogs: () => recentLogs.trim(),
      process: child,
      socksPort
    });
    throw error;
  }

  return {
    agent: new SocksProxyAgent(`socks5h://127.0.0.1:${socksPort}`),
    getRecentLogs: () => recentLogs.trim(),
    process: child,
    socksPort
  };
}

function stopWireguardTunnel(tunnel?: TunnelRuntime): void {
  if (!tunnel || tunnel.process.killed) return;

  tunnel.process.kill();
}

async function assertWireguardConfigExists(configPathForTunnel = wireguardConfigPath()): Promise<void> {
  try {
    await access(configPathForTunnel, fsConstants.R_OK);
  } catch {
    throw new Error("WireGuard tunnel is enabled, but no WireGuard config is saved.");
  }
}

async function assertWireproxyBinaryExists(wireproxyPath: string): Promise<void> {
  try {
    await access(wireproxyPath, process.platform === "win32" ? fsConstants.R_OK : fsConstants.X_OK);
  } catch {
    throw new Error(
      `WireGuard tunnel is enabled, but wireproxy was not found at ${wireproxyPath}. Set DAPPNODE_WIREPROXY_PATH or bundle the binary there.`
    );
  }
}

async function hasWireproxyBinary(): Promise<boolean> {
  try {
    await access(getWireproxyBinaryPath(), process.platform === "win32" ? fsConstants.R_OK : fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function getFreeLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Could not reserve a local WireGuard proxy port."));
          return;
        }

        resolve(address.port);
      });
    });
  });
}

function waitForPort(
  host: string,
  port: number,
  timeoutMs: number,
  child: ChildProcess,
  getStderr: () => string
): Promise<void> {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const tryConnect = (): void => {
      if (child.exitCode !== null) {
        reject(new Error(`wireproxy exited before the tunnel was ready. ${getStderr()}`.trim()));
        return;
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for wireproxy to listen on 127.0.0.1:${port}. ${getStderr()}`.trim()));
        return;
      }

      const socket = net.createConnection({ host, port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        setTimeout(tryConnect, 150);
      });
    };

    tryConnect();
  });
}

function normalizeWireguardConfigForWireproxy(config: string): string {
  let currentSection = "";

  return config
    .trim()
    .split(/\r?\n/)
    .filter((line) => {
      const trimmedLine = line.trim();
      const sectionMatch = trimmedLine.match(/^\[([^\]]+)\]$/);

      if (sectionMatch) currentSection = sectionMatch[1].toLowerCase();

      return !(currentSection === "interface" && /^listenport\s*=/i.test(trimmedLine));
    })
    .join("\n");
}

async function updateWireguardConfig(
  config: unknown,
  enabled: boolean,
  configPathForTunnel = wireguardConfigPath()
): Promise<void> {
  if (!enabled) return;
  if (typeof config !== "string" || !config.trim()) {
    await assertWireguardConfigExists(configPathForTunnel);
    return;
  }

  const normalizedConfig = normalizeWireguardConfigForWireproxy(config);
  if (!normalizedConfig.includes("[Interface]") || !normalizedConfig.includes("[Peer]")) {
    throw new Error("WireGuard config must include [Interface] and [Peer] sections.");
  }

  await writePrivateFile(configPathForTunnel, `${normalizedConfig}\n`);
}

async function hasWireguardConfig(configPathForTunnel = wireguardConfigPath()): Promise<boolean> {
  try {
    await access(configPathForTunnel, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function normalizeConnectionInput(input: unknown): Promise<{
  avatar?: unknown;
  backendUrl: string;
  name: string;
  profileId?: string;
  wireguardConfig?: unknown;
  wireguardEnabled: boolean;
}> {
  if (typeof input === "string") {
    return { backendUrl: normalizeBackendUrl(input), name: "My Dappnode", wireguardEnabled: false };
  }

  const connectionInput = input as ProfileConnectionInput;
  return {
    avatar: connectionInput?.avatar,
    backendUrl: normalizeBackendUrl(connectionInput?.backendUrl),
    name: normalizeProfileName(connectionInput?.name),
    profileId: normalizeProfileId(connectionInput?.profileId),
    wireguardConfig: connectionInput?.wireguard?.config,
    wireguardEnabled: connectionInput?.wireguard?.enabled === true
  };
}

function shouldProxyRequest(request: IncomingMessage): boolean {
  const method = request.method ?? "GET";
  const pathname = getRequestPathname(request);

  if (method !== "GET" && method !== "HEAD") return true;
  if (proxyExactGetPaths.has(pathname)) return true;

  return proxyGetPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function getRequestPathname(request: IncomingMessage): string {
  try {
    return new URL(request.url ?? "/", "http://dappnode-desktop.local").pathname;
  } catch {
    return "/";
  }
}

async function serveAdminUi(request: IncomingMessage, response: ServerResponse, adminUiPath: string): Promise<void> {
  const method = request.method ?? "GET";

  if (method !== "GET" && method !== "HEAD") {
    sendJsonError(response, 405, "Method not allowed.");
    return;
  }

  const pathname = getRequestPathname(request);
  let decodedPathname: string;

  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    sendJsonError(response, 400, "Malformed URL.");
    return;
  }

  const rootPath = path.resolve(adminUiPath);
  const requestedPath = path.resolve(rootPath, `.${decodedPathname}`);

  if (!isPathInside(requestedPath, rootPath)) {
    sendJsonError(response, 403, "Forbidden.");
    return;
  }

  const resolvedFile = await resolveStaticFile(requestedPath, rootPath, decodedPathname);

  if (!resolvedFile) {
    sendJsonError(response, 404, "File not found.");
    return;
  }

  const extension = path.extname(resolvedFile);
  response.writeHead(200, {
    "Cache-Control": path.basename(resolvedFile) === "index.html" ? "no-cache" : "public, max-age=86400",
    "Content-Type": mimeTypes[extension] ?? "application/octet-stream"
  });

  if (method === "HEAD") {
    response.end();
    return;
  }

  createReadStream(resolvedFile).pipe(response);
}

async function resolveStaticFile(
  requestedPath: string,
  rootPath: string,
  decodedPathname: string
): Promise<string | null> {
  const requestedFile = await stat(requestedPath).catch(() => null);

  if (requestedFile?.isFile()) return requestedPath;

  if (path.extname(decodedPathname)) return null;

  return path.join(rootPath, "index.html");
}

function isPathInside(childPath: string, parentPath: string): boolean {
  const relativePath = path.relative(parentPath, childPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function isServerResponse(response: ServerResponse | Socket): response is ServerResponse {
  return "writeHead" in response;
}

function sendJsonError(response: ServerResponse, statusCode: number, message: string): void {
  if (response.headersSent) {
    response.end();
    return;
  }

  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: { message } }));
}

async function createPackageIcon(metadata?: PackageWindowMetadata): Promise<string | NativeImage> {
  const iconUrl = parseHttpUrl(metadata?.iconUrl);
  if (!iconUrl) return appIconPath;

  try {
    const agent =
      desktopServer?.tunnel && isDappnodeLocalHostname(iconUrl.hostname) && !dappmanagerHostnames.has(iconUrl.hostname)
        ? desktopServer.tunnel.agent
        : undefined;
    const iconBuffer = await requestBuffer(iconUrl, agent);
    const icon = nativeImage.createFromBuffer(iconBuffer);

    return icon.isEmpty() ? appIconPath : icon;
  } catch (error) {
    console.error("Error loading package window icon", error);
    return appIconPath;
  }
}

function openExternalUrl(url: string): void {
  shell.openExternal(url).catch((error) => console.error("Error opening external URL", error));
}

async function openUrlFromApp(url: string, metadata?: PackageWindowMetadata): Promise<void> {
  const parsedUrl = parseHttpUrl(url);

  if (parsedUrl && isDappnodePackageUrl(parsedUrl)) {
    await openPackageWindow(parsedUrl, metadata);
    return;
  }

  openExternalUrl(url);
}

async function openPackageWindow(url: URL, metadata?: PackageWindowMetadata): Promise<void> {
  if (!desktopServer) throw new Error("Connect to Dappmanager before opening package windows.");

  const packageSession = session.fromPartition(`package:${Date.now()}:${Math.random()}`);
  if (desktopServer.tunnel) {
    await packageSession.setProxy({
      proxyBypassRules: "<local>",
      proxyRules: `socks5://127.0.0.1:${desktopServer.tunnel.socksPort}`
    });
  }

  const browserWindow = new BrowserWindow({
    backgroundColor: "#ffffff",
    height: 780,
    icon: await createPackageIcon(metadata),
    minHeight: 520,
    minWidth: 760,
    show: false,
    title: getPackageWindowTitle(url, metadata),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      session: packageSession
    },
    width: 1180
  });

  packageWindows.add(browserWindow);
  browserWindow.once("ready-to-show", () => browserWindow.show());
  browserWindow.once("closed", () => packageWindows.delete(browserWindow));
  browserWindow.webContents.setWindowOpenHandler(({ url: nextUrl }) => {
    openUrlFromApp(nextUrl).catch((error) => console.error("Error opening package URL", error));
    return { action: "deny" };
  });
  browserWindow.webContents.on("will-navigate", (event, nextUrl) => {
    const parsedUrl = parseHttpUrl(nextUrl);
    if (parsedUrl && isDappnodePackageUrl(parsedUrl)) return;

    event.preventDefault();
    openExternalUrl(nextUrl);
  });

  await browserWindow.loadURL(url.toString());
}

function closePackageWindows(): void {
  for (const browserWindow of packageWindows) {
    if (!browserWindow.isDestroyed()) browserWindow.close();
  }

  packageWindows.clear();
}

async function removeFileIfExists(filePath: string): Promise<void> {
  await unlink(filePath).catch((error) => {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  });
}

async function clearDesktopSettings(): Promise<void> {
  await stopDesktopServer();
  closePackageWindows();
  await Promise.all([
    removeFileIfExists(configPath()),
    removeFileIfExists(pendingWireguardDevicePath()),
    removeFileIfExists(wireguardConfigPath()),
    removeFileIfExists(wireproxyConfigPath()),
    rm(profileWireguardConfigDir(), { force: true, recursive: true })
  ]);
  await mainWindow?.loadFile(connectionPagePath);
}

async function confirmAndClearDesktopSettings(): Promise<void> {
  const options = {
    buttons: ["Clear Settings", "Cancel"],
    cancelId: 1,
    defaultId: 1,
    detail:
      "This removes the saved backend URL and local WireGuard config from this computer. It does not remove WireGuard devices from your Dappnode.",
    message: "Clear all Dappnode Desktop settings?",
    type: "warning" as const
  };
  const result = mainWindow ? await dialog.showMessageBox(mainWindow, options) : await dialog.showMessageBox(options);

  if (result.response !== 0) return;
  await clearDesktopSettings();
}

function setupAppIdentity(): void {
  app.setName("Dappnode Desktop");

  if (process.platform === "darwin" && app.dock) {
    const dockIcon = nativeImage.createFromPath(appIconPath);
    if (!dockIcon.isEmpty()) app.dock.setIcon(dockIcon);
  }
}

function createMainWindow(): ElectronBrowserWindow {
  const browserWindow = new BrowserWindow({
    backgroundColor: "#f5f7f0",
    height: 860,
    icon: appIconPath,
    minHeight: 640,
    minWidth: 980,
    show: false,
    title: "Dappnode Desktop",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      sandbox: true
    },
    width: 1320
  });

  browserWindow.once("ready-to-show", () => browserWindow.show());
  browserWindow.webContents.setWindowOpenHandler(({ url }) => {
    openUrlFromApp(url).catch((error) => console.error("Error opening URL", error));
    return { action: "deny" };
  });
  browserWindow.webContents.on("will-navigate", (event, url) => {
    const currentLocalUrl = desktopServer?.url;

    if (currentLocalUrl && url.startsWith(currentLocalUrl)) return;
    if (url.startsWith("file://")) return;

    event.preventDefault();
    openUrlFromApp(url).catch((error) => console.error("Error opening URL", error));
  });

  if (process.env.ELECTRON_DEBUG) browserWindow.webContents.openDevTools();

  return browserWindow;
}

async function showConnectionScreen(message?: string, view?: "add"): Promise<void> {
  const query: Record<string, string> = {};
  if (message) query.error = message;
  if (view) query.view = view;

  await stopDesktopServer();
  await mainWindow?.loadFile(connectionPagePath, Object.keys(query).length > 0 ? { query } : undefined);
}

async function loadAdminUi(backendUrl: string, wireguardEnabled: boolean, configPathForTunnel?: string): Promise<void> {
  const localUrl = await startDesktopServer(backendUrl, wireguardEnabled, configPathForTunnel);
  await mainWindow?.loadURL(localUrl);
}

function setupIpcHandlers(): void {
  ipcMain.handle("backend:get", async (): Promise<string> => {
    const config = await readConfigFile();
    return getActiveProfile(config)?.backendUrl ?? "";
  });

  ipcMain.handle("connection:get", async (): Promise<ConnectionStatus> => {
    const config = await readConfigFile();
    const activeProfile = getActiveProfile(config);
    return {
      activeProfileId: activeProfile?.id,
      backendUrl: activeProfile?.backendUrl ?? "",
      hasTunnelHelper: await hasWireproxyBinary(),
      hasWireguardConfig: activeProfile ? await hasWireguardConfig(getWireguardConfigPath(activeProfile)) : false,
      profiles: config.profiles ?? [],
      wireguardEnabled: activeProfile?.wireguardEnabled === true
    };
  });

  ipcMain.handle("menu:show", async (): Promise<IpcResult> => {
    try {
      await showConnectionScreen();

      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(
    "profile:connect",
    async (_event, input: unknown): Promise<IpcResult<{ profile: DappnodeProfile }>> => {
      try {
        const profileId = normalizeProfileId(input);
        if (!profileId) throw new Error("Choose a Dappnode profile.");

        const config = await readConfigFile();
        const profile = config.profiles?.find((storedProfile) => storedProfile.id === profileId);
        if (!profile) throw new Error("That Dappnode profile no longer exists.");

        await writeConfigFile({ ...config, activeProfileId: profile.id });
        await loadAdminUi(profile.backendUrl, profile.wireguardEnabled, getWireguardConfigPath(profile));

        return { ok: true, profile };
      } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle("profile:delete", async (_event, input: unknown): Promise<IpcResult> => {
    try {
      const profileId = normalizeProfileId(input);
      if (!profileId) throw new Error("Choose a Dappnode profile.");

      const config = await readConfigFile();
      const profile = config.profiles?.find((storedProfile) => storedProfile.id === profileId);
      if (!profile) throw new Error("That Dappnode profile no longer exists.");

      await removeFileIfExists(getWireguardConfigPath(profile));
      const profiles = (config.profiles ?? []).filter((storedProfile) => storedProfile.id !== profile.id);
      await writeConfigFile({
        activeProfileId: profiles[0]?.id,
        profiles
      });

      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("package:open", async (_event, input: unknown): Promise<IpcResult> => {
    try {
      const { metadata, url } = normalizePackageWindowInput(input);
      await openPackageWindow(url, metadata);

      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle(
    "connection:auto-wireguard",
    async (
      _event,
      input: unknown
    ): Promise<
      IpcResult<{ backendUrl: string; configScope: WireguardConfigScope; device: string; profile: DappnodeProfile }>
    > => {
      try {
        const result = await setupWireguardAutomatically(input);

        return { ok: true, ...result };
      } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle(
    "backend:save",
    async (_event, input: unknown): Promise<IpcResult<{ backendUrl: string; profile: DappnodeProfile }>> => {
      try {
        const { avatar, backendUrl, name, profileId } = await normalizeConnectionInput(input);
        await validateBackendUrl(backendUrl);
        await assertAdminUiBuildExists();
        const profile = createDappnodeProfile(await readConfigFile(), {
          avatar,
          backendUrl,
          name,
          profileId,
          wireguardEnabled: false
        });
        await writeConfigFile(upsertProfile(await readConfigFile(), profile));
        await loadAdminUi(backendUrl, false);

        return { ok: true, backendUrl, profile };
      } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle(
    "connection:save",
    async (_event, input: unknown): Promise<IpcResult<{ backendUrl: string; profile: DappnodeProfile }>> => {
      let tunnel: TunnelRuntime | undefined;

      try {
        const { avatar, backendUrl, name, profileId, wireguardConfig, wireguardEnabled } =
          await normalizeConnectionInput(input);
        const profile = createDappnodeProfile(await readConfigFile(), {
          avatar,
          backendUrl,
          name,
          profileId,
          wireguardEnabled
        });
        const configPathForTunnel = wireguardEnabled ? getWireguardConfigPath(profile) : undefined;
        await updateWireguardConfig(wireguardConfig, wireguardEnabled, configPathForTunnel);
        tunnel = wireguardEnabled ? await startWireguardTunnel(configPathForTunnel) : undefined;

        try {
          await validateBackendUrl(backendUrl, tunnel?.agent);
        } catch (error) {
          throw new Error(formatTunnelValidationError(error, tunnel));
        }
        stopWireguardTunnel(tunnel);
        tunnel = undefined;

        await assertAdminUiBuildExists();
        await writeConfigFile(upsertProfile(await readConfigFile(), profile));
        await loadAdminUi(backendUrl, wireguardEnabled, configPathForTunnel);

        return { ok: true, backendUrl, profile };
      } catch (error) {
        stopWireguardTunnel(tunnel);
        return { ok: false, error: getErrorMessage(error) };
      }
    }
  );

  ipcMain.handle("backend:clear", async (): Promise<IpcResult> => {
    try {
      await clearDesktopSettings();

      return { ok: true };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });
}

function formatTunnelValidationError(error: unknown, tunnel?: TunnelRuntime): string {
  const message = getErrorMessage(error);
  const recentLogs = tunnel?.getRecentLogs();

  if (!recentLogs) return message;

  const relevantLines = recentLogs
    .split(/\r?\n/)
    .filter((line) => /handshake|error|failed|timeout|retry/i.test(line))
    .slice(-8);

  if (relevantLines.length === 0) return message;

  return `${message}\n\nWireGuard tunnel logs:\n${relevantLines.join("\n")}`;
}

function setupMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Dappnode",
      submenu: [
        {
          click: () => {
            showConnectionScreen().catch((error) => console.error("Error opening connection screen", error));
          },
          label: "Main Menu",
          accelerator: "CmdOrCtrl+Shift+M"
        },
        {
          click: () => {
            showConnectionScreen(undefined, "add").catch((error) =>
              console.error("Error opening add Dappnode screen", error)
            );
          },
          label: "Add Dappnode...",
          accelerator: "CmdOrCtrl+N"
        },
        {
          click: () => {
            confirmAndClearDesktopSettings().catch((error) => console.error("Error clearing desktop settings", error));
          },
          label: "Clear All Settings..."
        },
        { type: "separator" },
        {
          click: () => mainWindow?.reload(),
          label: "Reload",
          accelerator: "CmdOrCtrl+R"
        },
        { type: "separator" },
        { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" }
      ]
    },
    {
      label: "View",
      submenu: [{ role: "toggleDevTools" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  stopDesktopServer().catch((error) => console.error("Error stopping desktop server", error));
});

app
  .whenReady()
  .then(async () => {
    setupAppIdentity();
    setupIpcHandlers();
    setupMenu();
    mainWindow = createMainWindow();

    await showConnectionScreen();
  })
  .catch((error) => {
    console.error("Error starting Dappnode desktop app", error);
    app.quit();
  });
