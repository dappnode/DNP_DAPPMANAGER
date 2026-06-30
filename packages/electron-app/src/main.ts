import electron from "electron";
import type { BrowserWindow as ElectronBrowserWindow, MenuItemConstructorOptions } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import { createReadStream, constants as fsConstants } from "node:fs";
import { access, mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import https from "node:https";
import net from "node:net";
import type { Socket } from "node:net";
import path from "node:path";
import httpProxy from "http-proxy";
import { SocksProxyAgent } from "socks-proxy-agent";

const { app, BrowserWindow, ipcMain, Menu, shell } = electron;

interface DesktopConfig {
  backendUrl?: string;
  wireguardEnabled?: boolean;
}

interface DesktopServer {
  backendUrl: string;
  server: http.Server;
  sockets: Set<Socket>;
  tunnel?: TunnelRuntime;
  url: string;
  wireguardEnabled: boolean;
}

interface ConnectionInput {
  backendUrl?: unknown;
  wireguard?: {
    config?: unknown;
    enabled?: unknown;
  };
}

interface ConnectionStatus {
  backendUrl: string;
  hasTunnelHelper: boolean;
  hasWireguardConfig: boolean;
  wireguardEnabled: boolean;
}

interface TunnelRuntime {
  agent: SocksProxyAgent;
  getRecentLogs: () => string;
  process: ChildProcess;
  socksPort: number;
}

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
const backendValidationTimeoutMs = 7_000;
const tunnelStartupTimeoutMs = 8_000;

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

function configPath(): string {
  return path.join(app.getPath("userData"), "desktop-config.json");
}

function wireguardConfigPath(): string {
  return path.join(app.getPath("userData"), "wireguard.conf");
}

function wireproxyConfigPath(): string {
  return path.join(app.getPath("userData"), "wireproxy.conf");
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

async function readConfigFile(): Promise<DesktopConfig> {
  try {
    const rawConfig = await readFile(configPath(), "utf8");
    const parsedConfig = JSON.parse(rawConfig) as DesktopConfig;

    return typeof parsedConfig.backendUrl === "string"
      ? {
          backendUrl: parsedConfig.backendUrl,
          wireguardEnabled: parsedConfig.wireguardEnabled === true
        }
      : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeConfigFile(config: DesktopConfig): Promise<void> {
  await mkdir(path.dirname(configPath()), { recursive: true });
  await writePrivateFile(configPath(), `${JSON.stringify(config, null, 2)}\n`);
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

async function startDesktopServer(backendUrl: string, wireguardEnabled: boolean): Promise<string> {
  if (desktopServer?.backendUrl === backendUrl && desktopServer.wireguardEnabled === wireguardEnabled) {
    return desktopServer.url;
  }

  await stopDesktopServer();
  await assertAdminUiBuildExists();

  const tunnel = wireguardEnabled ? await startWireguardTunnel() : undefined;
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
        reject(new Error("Could not bind DAppNode desktop server."));
        return;
      }

      resolve(`http://127.0.0.1:${address.port}/`);
    });
  });

  desktopServer = { backendUrl, server, sockets, tunnel, url, wireguardEnabled };

  return url;
}

async function stopDesktopServer(): Promise<void> {
  if (!desktopServer) return;

  const { server, sockets, tunnel } = desktopServer;
  desktopServer = null;

  for (const socket of sockets) socket.destroy();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });

  stopWireguardTunnel(tunnel);
}

async function startWireguardTunnel(): Promise<TunnelRuntime> {
  const wireproxyPath = getWireproxyBinaryPath();
  const wireguardPath = wireguardConfigPath();

  await assertWireguardConfigExists();
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

async function assertWireguardConfigExists(): Promise<void> {
  try {
    await access(wireguardConfigPath(), fsConstants.R_OK);
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

async function updateWireguardConfig(config: unknown, enabled: boolean): Promise<void> {
  if (!enabled) return;
  if (typeof config !== "string" || !config.trim()) {
    await assertWireguardConfigExists();
    return;
  }

  const normalizedConfig = config.trim();
  if (!normalizedConfig.includes("[Interface]") || !normalizedConfig.includes("[Peer]")) {
    throw new Error("WireGuard config must include [Interface] and [Peer] sections.");
  }

  await writePrivateFile(wireguardConfigPath(), `${normalizedConfig}\n`);
}

async function hasWireguardConfig(): Promise<boolean> {
  try {
    await access(wireguardConfigPath(), fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function normalizeConnectionInput(input: unknown): Promise<{
  backendUrl: string;
  wireguardConfig?: unknown;
  wireguardEnabled: boolean;
}> {
  if (typeof input === "string") {
    return { backendUrl: normalizeBackendUrl(input), wireguardEnabled: false };
  }

  const connectionInput = input as ConnectionInput;
  return {
    backendUrl: normalizeBackendUrl(connectionInput?.backendUrl),
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

function createMainWindow(): ElectronBrowserWindow {
  const browserWindow = new BrowserWindow({
    backgroundColor: "#f5f7f0",
    height: 860,
    icon: appIconPath,
    minHeight: 640,
    minWidth: 980,
    show: false,
    title: "DAppNode Desktop",
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
    shell.openExternal(url).catch((error) => console.error("Error opening external URL", error));
    return { action: "deny" };
  });
  browserWindow.webContents.on("will-navigate", (event, url) => {
    const currentLocalUrl = desktopServer?.url;

    if (currentLocalUrl && url.startsWith(currentLocalUrl)) return;
    if (url.startsWith("file://")) return;

    event.preventDefault();
    shell.openExternal(url).catch((error) => console.error("Error opening external URL", error));
  });

  if (process.env.ELECTRON_DEBUG) browserWindow.webContents.openDevTools();

  return browserWindow;
}

async function showConnectionScreen(message?: string): Promise<void> {
  await stopDesktopServer();
  await mainWindow?.loadFile(
    connectionPagePath,
    message
      ? {
          query: { error: message }
        }
      : undefined
  );
}

async function loadAdminUi(backendUrl: string, wireguardEnabled: boolean): Promise<void> {
  const localUrl = await startDesktopServer(backendUrl, wireguardEnabled);
  await mainWindow?.loadURL(localUrl);
}

function setupIpcHandlers(): void {
  ipcMain.handle("backend:get", async (): Promise<string> => {
    const config = await readConfigFile();
    return config.backendUrl ?? "";
  });

  ipcMain.handle("connection:get", async (): Promise<ConnectionStatus> => {
    const config = await readConfigFile();
    return {
      backendUrl: config.backendUrl ?? "",
      hasTunnelHelper: await hasWireproxyBinary(),
      hasWireguardConfig: await hasWireguardConfig(),
      wireguardEnabled: config.wireguardEnabled === true
    };
  });

  ipcMain.handle("backend:save", async (_event, input: unknown): Promise<IpcResult<{ backendUrl: string }>> => {
    try {
      const backendUrl = normalizeBackendUrl(input);
      await validateBackendUrl(backendUrl);
      await assertAdminUiBuildExists();
      await writeConfigFile({ backendUrl, wireguardEnabled: false });
      await loadAdminUi(backendUrl, false);

      return { ok: true, backendUrl };
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("connection:save", async (_event, input: unknown): Promise<IpcResult<{ backendUrl: string }>> => {
    let tunnel: TunnelRuntime | undefined;

    try {
      const { backendUrl, wireguardConfig, wireguardEnabled } = await normalizeConnectionInput(input);
      await updateWireguardConfig(wireguardConfig, wireguardEnabled);
      tunnel = wireguardEnabled ? await startWireguardTunnel() : undefined;

      try {
        await validateBackendUrl(backendUrl, tunnel?.agent);
      } catch (error) {
        throw new Error(formatTunnelValidationError(error, tunnel));
      }
      stopWireguardTunnel(tunnel);
      tunnel = undefined;

      await assertAdminUiBuildExists();
      await writeConfigFile({ backendUrl, wireguardEnabled });
      await loadAdminUi(backendUrl, wireguardEnabled);

      return { ok: true, backendUrl };
    } catch (error) {
      stopWireguardTunnel(tunnel);
      return { ok: false, error: getErrorMessage(error) };
    }
  });

  ipcMain.handle("backend:clear", async (): Promise<IpcResult> => {
    try {
      await writeConfigFile({});
      await unlink(wireguardConfigPath()).catch((error) => {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      });
      await showConnectionScreen();

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
      label: "DAppNode",
      submenu: [
        {
          click: () => {
            showConnectionScreen().catch((error) => console.error("Error opening connection screen", error));
          },
          label: "Change Connection"
        },
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
    app.setName("DAppNode Desktop");
    setupIpcHandlers();
    setupMenu();
    mainWindow = createMainWindow();

    const config = await readConfigFile();
    if (!config.backendUrl) {
      await showConnectionScreen();
      return;
    }

    try {
      await loadAdminUi(config.backendUrl, config.wireguardEnabled === true);
    } catch (error) {
      await showConnectionScreen(getErrorMessage(error));
    }
  })
  .catch((error) => {
    console.error("Error starting DAppNode desktop app", error);
    app.quit();
  });
