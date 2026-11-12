// Open /theme-pages.html with `yarn mock-standalone`. Uses only mocked data.
import { auditContrast } from "./contrast";

if (!import.meta.env.VITE_APP_MOCK) throw new Error("Page contrast audit requires the standalone mock backend");
localStorage.setItem("theme", "light");
const reportRequested = new URLSearchParams(location.search).has("report");
const routes = [
  "/dashboard",
  "/vpn/tailscale",
  "/vpn/wireguard",
  "/vpn/openvpn",
  "/wireless-network/wifi",
  "/installer/dnp",
  "/installer/public",
  "/packages/my",
  "/packages/system",
  "/packages/my/tailscale.dnp.dappnode.eth/info",
  "/packages/my/tailscale.dnp.dappnode.eth/config",
  "/packages/my/tailscale.dnp.dappnode.eth/network",
  "/packages/my/tailscale.dnp.dappnode.eth/logs",
  "/packages/my/tailscale.dnp.dappnode.eth/file-manager",
  "/installer/dnp/geth.dnp.dappnode.eth",
  "/wireless-network/local",
  "/stakers/ethereum",
  "/stakers/gnosis",
  "/stakers/hoodi",
  "/system/info",
  "/system/auto-updates",
  "/system/app",
  "/system/profile",
  "/system/network",
  "/system/update",
  "/system/ipfs",
  "/system/security",
  "/system/host",
  "/system/advanced",
  "/notifications/inbox",
  "/notifications/settings",
  "/notifications/devices",
  "/notifications/legacy",
  "/community",
  "/sdk",
  "/support/auto-diagnose",
  "/support/report",
  "/support/ports",
  "/support/activity",
  "/premium/activate",
  "/premium/advanced-notifications",
  "/premium/premium-support",
  "/premium/backup-node",
  "/nexus"
];
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
await import("../../index");
await delay(2500);
const results = [];
for (const theme of ["light", "dark"]) {
  const toggle = document.querySelector<HTMLButtonElement>(`button[aria-label="Display ${theme} mode"]`);
  toggle?.click();
  await delay(300);
  for (const route of routes) {
    history.pushState({}, "", route);
    dispatchEvent(new PopStateEvent("popstate"));
    await delay(1000);
    // Dismiss the mock Smooth promotion, never submit any forms.
    document.querySelector<HTMLButtonElement>(".custom-modal .btn-close")?.click();
    const main = document.querySelector<HTMLElement>(".body");
    const page = document.querySelector<HTMLElement>("#main");
    const pageState = page?.querySelector(".error-view")
      ? "mock error state"
      : page?.querySelector(".loading-view")
        ? "includes loading state"
        : "rendered";
    results.push({
      theme,
      route,
      pageState,
      ...(main && page?.innerText.trim()
        ? auditContrast(main)
        : { checked: 0, failures: ["Page did not render"], skipped: [] })
    });
    document.title = `Auditing ${theme} ${route}`;
  }
}
const report = document.createElement("pre");
report.style.cssText = "position:relative;z-index:99999;padding:24px;white-space:pre-wrap;background:white;color:black";
report.textContent = JSON.stringify(results, null, 2);
document.body.prepend(report);
document.title = `${results.reduce((count, result) => count + result.failures.length, 0)} page contrast findings`;
// Optional local test runner sink; no data leaves localhost.
if (reportRequested) {
  await fetch("http://127.0.0.1:5186/results", { method: "POST", body: JSON.stringify(results) });
}
