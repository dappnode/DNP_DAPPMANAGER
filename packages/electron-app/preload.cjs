const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dappnodeDesktop", {
  getBackendUrl: () => ipcRenderer.invoke("backend:get"),
  getConnectionConfig: () => ipcRenderer.invoke("connection:get"),
  openPackageWindow: (packageWindow) => ipcRenderer.invoke("package:open", packageWindow),
  saveBackendUrl: (backendUrl) => ipcRenderer.invoke("backend:save", backendUrl),
  saveConnectionConfig: (config) => ipcRenderer.invoke("connection:save", config),
  setupWireguardAutomatically: (config) => ipcRenderer.invoke("connection:auto-wireguard", config),
  clearBackendUrl: () => ipcRenderer.invoke("backend:clear")
});

const dappmanagerHostnames = new Set(["dappmanager.dappnode", "my.dappnode", "dappnode.local", "172.33.1.7"]);

function isDappnodeLocalHostname(hostname) {
  const normalizedHostname = hostname.toLowerCase();

  return (
    dappmanagerHostnames.has(normalizedHostname) ||
    normalizedHostname.endsWith(".dappnode") ||
    normalizedHostname.endsWith(".dappnode.local") ||
    normalizedHostname.endsWith(".dappnode.private")
  );
}

function isDappnodePackageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      isDappnodeLocalHostname(hostname) &&
      !dappmanagerHostnames.has(hostname)
    );
  } catch {
    return false;
  }
}

function resolvePackageIconUrl(rawIconUrl) {
  if (!rawIconUrl) return undefined;

  try {
    const parsedIconUrl = new URL(rawIconUrl, window.location.href);

    if (isDappnodeLocalHostname(parsedIconUrl.hostname) && parsedIconUrl.origin !== window.location.origin) {
      return new URL(`${parsedIconUrl.pathname}${parsedIconUrl.search}`, window.location.origin).toString();
    }

    return parsedIconUrl.toString();
  } catch {
    return undefined;
  }
}

window.addEventListener(
  "click",
  (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const anchor = event.target?.closest?.("a[href]");
    if (!anchor || !isDappnodePackageUrl(anchor.href)) return;

    event.preventDefault();
    ipcRenderer
      .invoke("package:open", {
        iconUrl: resolvePackageIconUrl(anchor.dataset.dappnodePackageIcon),
        title: anchor.dataset.dappnodePackageTitle || anchor.textContent?.trim(),
        url: anchor.href
      })
      .catch((error) => console.error("Error opening package window", error));
  },
  true
);
