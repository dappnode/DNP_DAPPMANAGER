import type { InstalledPackageDetailData } from "@dappnode/types";
import { tailscaleStatusKey, type TailscaleStatus } from "../../../pages/vpn/tailscaleStatus";

const tailscaleMockScenarios = [
  "login",
  "rotated",
  "preparing",
  "approval",
  "connected",
  "offline",
  "stopped",
  "restarting",
  "reporter-stopped",
  "legacy",
  "unavailable",
  "stale",
  "invalid",
  "missing"
] as const;
type TailscaleMockScenario = (typeof tailscaleMockScenarios)[number];

/** Synthetic links only. Never contact Tailscale or simulate real credentials. */
export function mockTailscaleReport(
  dnp: InstalledPackageDetailData,
  scenario: TailscaleMockScenario,
  now = Date.now() / 1000
): InstalledPackageDetailData {
  const status: TailscaleStatus = {
    version: 1,
    state: "NeedsLogin",
    online: false,
    authUrl: "https://login.tailscale.com/a/MOCK-ONLY?demo=one&next=%2Fdevices%3Fx%3D1",
    updatedAt: Math.floor(now)
  };
  if (scenario === "rotated") status.authUrl = "https://login.tailscale.com/a/MOCK-ROTATED?demo=two&next=%2F";
  if (scenario === "preparing") status.authUrl = null;
  if (scenario === "approval") status.state = "NeedsMachineAuth";
  if (scenario === "connected" || scenario === "offline") status.state = "Running";
  if (scenario === "connected") status.online = true;
  if (scenario === "stopped") status.state = "Stopped";
  if (scenario === "unavailable") status.state = "Unavailable";
  if (status.state !== "NeedsLogin") status.authUrl = null;
  if (scenario === "stale") status.updatedAt -= 91;
  const data: Record<string, string> = {
    ...dnp.packageSentData,
    [tailscaleStatusKey]: scenario === "invalid" ? "{invalid" : JSON.stringify(status)
  };
  if (scenario === "missing") delete data[tailscaleStatusKey];
  return {
    ...dnp,
    containers: dnp.containers
      .filter((container) => scenario !== "legacy" || container.serviceName !== "reporter")
      .map((container) => ({
        ...container,
        state:
          scenario === "restarting" && container.serviceName === "tailscale"
            ? "restarting"
            : scenario === "reporter-stopped" && container.serviceName === "reporter"
              ? "exited"
              : container.state
      })),
    packageSentData: data
  };
}
