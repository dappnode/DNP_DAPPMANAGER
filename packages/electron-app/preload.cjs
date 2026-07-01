const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("dappnodeDesktop", {
  connectProfile: (profileId) => ipcRenderer.invoke("profile:connect", profileId),
  deleteProfile: (profileId) => ipcRenderer.invoke("profile:delete", profileId),
  getBackendUrl: () => ipcRenderer.invoke("backend:get"),
  getConnectionConfig: () => ipcRenderer.invoke("connection:get"),
  openPackageWindow: (packageWindow) => ipcRenderer.invoke("package:open", packageWindow),
  saveBackendUrl: (backendUrl) => ipcRenderer.invoke("backend:save", backendUrl),
  saveConnectionConfig: (config) => ipcRenderer.invoke("connection:save", config),
  showMainMenu: () => ipcRenderer.invoke("menu:show"),
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

function installDesktopMenuStyles() {
  if (document.getElementById("dappnode-desktop-menu-style")) return;

  const style = document.createElement("style");
  style.id = "dappnode-desktop-menu-style";
  style.textContent = `
    .dappnode-desktop-menu-item {
      width: 100%;
      height: 2.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 0;
      border-radius: 5px;
      background: transparent;
      color: inherit;
      padding: 0 10px;
      font: inherit;
      font-size: 0.8rem;
      text-align: left;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
    }

    .dappnode-desktop-menu-item:hover,
    .dappnode-desktop-menu-item:focus-visible {
      background: var(--color-light-background-main, #f7f9f9);
      color: black;
      font-weight: 600;
      outline: none;
    }

    .dappnode-desktop-menu-icon {
      width: 1.2rem;
      flex: 0 0 1.2rem;
      opacity: 0.45;
      font-size: 1rem;
      line-height: 1;
      text-align: center;
    }

    .dappnode-desktop-menu-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    #dark .dappnode-desktop-menu-item:hover,
    #dark .dappnode-desktop-menu-item:focus-visible {
      background: var(--color-dark-card, #414141);
      color: var(--color-dark-maintext, #ffffff);
    }

    @media (max-width: 40rem) {
      .dappnode-desktop-menu-item {
        justify-content: center;
        padding: 0;
      }

      .dappnode-desktop-menu-label {
        display: none;
      }
    }
  `;
  document.head.append(style);
}

function createDesktopMenuItem() {
  const button = document.createElement("button");
  button.id = "dappnode-desktop-menu-item";
  button.className = "dappnode-desktop-menu-item";
  button.type = "button";
  button.setAttribute("aria-label", "Back to Dappnode Desktop menu");

  const icon = document.createElement("span");
  icon.className = "dappnode-desktop-menu-icon";
  icon.textContent = "‹";
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = "dappnode-desktop-menu-label";
  label.textContent = "Desktop menu";

  button.append(icon, label);
  button.addEventListener("click", () => {
    ipcRenderer.invoke("menu:show").catch((error) => console.error("Error opening main menu", error));
  });

  return button;
}

function installDesktopMenuItem() {
  if (window.location.protocol === "file:") return;

  installDesktopMenuStyles();

  const insertMenuItem = () => {
    const nav = document.querySelector("#sidebar > .nav");
    if (!nav || document.getElementById("dappnode-desktop-menu-item")) return;

    nav.prepend(createDesktopMenuItem());
  };

  insertMenuItem();

  const observer = new MutationObserver(insertMenuItem);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", installDesktopMenuItem, { once: true });
} else {
  installDesktopMenuItem();
}
