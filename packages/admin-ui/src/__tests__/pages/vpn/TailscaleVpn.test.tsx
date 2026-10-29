import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDnp, sampleContainer } from "../../../__mock-backend__/data/sample";
import { mockTailscaleReport } from "./fixtures";
import { tailscale } from "../../../__mock-backend__/data/dnps/tailscale";
import { TailscaleVpn } from "../../../pages/vpn/components/TailscaleVpn";
import { TailscaleStatusPanel } from "../../../pages/vpn/components/TailscaleStatusPanel";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  revalidate: vi.fn(),
  navigate: vi.fn(),
  config: vi.fn()
}));
vi.mock("api", () => ({ useApi: { packageGet: mocks.request }, api: {} }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("pages/installer", () => ({ getInstallerPath: () => "/installer" }));
vi.mock("components/Loading", () => ({ default: () => <p>Loading package</p> }));
vi.mock("components/ErrorView", () => ({ default: () => <p>Request failed</p> }));
vi.mock("pages/packages/components/Config", () => ({
  Config: (props: unknown) => {
    mocks.config(props);
    return <div>Auth-key configuration</div>;
  }
}));
vi.mock("../../../pages/vpn/components/VpnDocsGuide", () => ({ VpnDocsGuide: () => <div>Setup guide</div> }));

const dnpName = "tailscale.dnp.dappnode.eth";
const base = {
  ...sampleDnp,
  dnpName,
  userSettings: tailscale.userSettings,
  setupWizard: tailscale.setupWizard,
  containers: ["tailscale", "reporter"].map((serviceName) => ({ ...sampleContainer, serviceName }))
};
let renderer: ReactTestRenderer;
const render = (element: React.ReactElement) =>
  act(() => {
    renderer = create(element);
  });
const update = (element: React.ReactElement) =>
  act(() => {
    renderer.update(element);
  });
const links = () => renderer.root.findAllByType("a").filter((link) => link.children.includes("Sign in to Tailscale"));
const content = () => JSON.stringify(renderer.toJSON());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-29T12:00:00Z"));
  mocks.request.mockReturnValue({
    data: mockTailscaleReport(base, "login"),
    revalidate: mocks.revalidate,
    isValidating: false
  });
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("Tailscale VPN status", () => {
  it("opens fresh sign-in in another tab without referrer and retains config/docs", () => {
    render(<TailscaleVpn />);
    expect(links()).toHaveLength(1);
    expect(links()[0].props).toMatchObject({
      target: "_blank",
      rel: "noopener noreferrer",
      referrerPolicy: "no-referrer"
    });
    expect(content()).toContain("Auth-key configuration");
    expect(content()).toContain("Setup guide");
    expect(mocks.config).toHaveBeenCalledWith(
      expect.objectContaining({ dnpName, userSettings: tailscale.userSettings, setupWizard: tailscale.setupWizard })
    );
    expect(mocks.request).toHaveBeenCalledWith({ dnpName });
  });
  it("rotates links intact and removes them when authentication completes on a package update", () => {
    render(<TailscaleVpn />);
    const next = mockTailscaleReport(base, "rotated");
    mocks.request.mockReturnValue({ data: next, revalidate: mocks.revalidate });
    update(<TailscaleVpn />);
    expect(links()[0].props.href).toBe(JSON.parse(next.packageSentData["tailscale.status"]).authUrl);
    expect(links()[0].props.href).toContain("?demo=two&next=%2F");
    mocks.request.mockReturnValue({ data: mockTailscaleReport(base, "connected"), revalidate: mocks.revalidate });
    update(<TailscaleVpn />);
    expect(links()).toHaveLength(0);
    expect(content()).toContain("Connected to Tailscale");
  });
  it.each([
    ["preparing", "Preparing Tailscale sign-in"],
    ["approval", "Awaiting device approval"],
    ["connected", "Connected to Tailscale"],
    ["offline", "Reconnecting"],
    ["stopped", "Tailscale stopped"],
    ["legacy", "Upgrade the Tailscale package"],
    ["restarting", "services are starting"],
    ["reporter-stopped", "reporter is stopped"],
    ["missing", "status unavailable"],
    ["invalid", "status unavailable"],
    ["stale", "status unavailable"],
    ["unavailable", "status unavailable"]
  ] as const)("shows %s without a sign-in link", (scenario, message) => {
    render(<TailscaleStatusPanel dnp={mockTailscaleReport(base, scenario)} />);
    expect(links()).toHaveLength(0);
    expect(content()).toContain(message);
    if (scenario === "approval")
      expect(renderer.root.findByType("a").props.href).toBe("https://login.tailscale.com/admin/machines");
  });
  it.each(["login", "connected"] as const)(
    "expires %s while idle and cached refetches cannot reset age",
    (scenario) => {
      const dnp = mockTailscaleReport(base, scenario);
      render(<TailscaleStatusPanel dnp={dnp} />);
      act(() => vi.advanceTimersByTime(89000));
      update(<TailscaleStatusPanel dnp={{ ...dnp }} />);
      expect(content()).not.toContain("status unavailable");
      act(() => vi.advanceTimersByTime(2000));
      expect(links()).toHaveLength(0);
      expect(content()).toContain("status unavailable");
      expect(content()).not.toContain("Connected to Tailscale");
    }
  );
  it.each(["tailscale", "reporter"])("hides cached links when %s stops, ignores aggregate flags and health", (name) => {
    const dnp = mockTailscaleReport(base, "login");
    const stopped = {
      ...dnp,
      containers: dnp.containers.map((c) =>
        c.serviceName === name ? { ...c, state: "exited" as const, running: true } : c
      )
    };
    render(<TailscaleStatusPanel dnp={stopped} />);
    expect(links()).toHaveLength(0);
  });
  it("waits for a newly observed report after service restart", () => {
    const dnp = mockTailscaleReport(base, "login");
    render(<TailscaleStatusPanel dnp={dnp} />);
    expect(links()).toHaveLength(1);
    update(<TailscaleStatusPanel dnp={mockTailscaleReport(base, "restarting")} />);
    expect(links()).toHaveLength(0);
    update(<TailscaleStatusPanel dnp={dnp} />);
    expect(links()).toHaveLength(0);
    act(() => vi.advanceTimersByTime(2000));
    update(<TailscaleStatusPanel dnp={mockTailscaleReport(base, "rotated")} />);
    expect(links()).toHaveLength(1);
  });
  it("removes a cached link during a refresh and after refresh failure", () => {
    const dnp = mockTailscaleReport(base, "login");
    render(<TailscaleVpn />);
    for (const request of [{ isValidating: true }, { error: Error("failed") }]) {
      mocks.request.mockReturnValue({ data: dnp, revalidate: mocks.revalidate, ...request });
      update(<TailscaleVpn />);
      expect(links()).toHaveLength(0);
    }
  });
  it("keeps the existing loading and install action", () => {
    mocks.request.mockReturnValue({ revalidate: mocks.revalidate, isValidating: true });
    render(<TailscaleVpn />);
    expect(content()).toContain("Loading package");
    mocks.request.mockReturnValue({
      revalidate: mocks.revalidate,
      error: Error("No DNP was found for name " + dnpName)
    });
    update(<TailscaleVpn />);
    expect(content()).toContain("INSTALL TAILSCALE PACKAGE");
    act(() => renderer.root.findByType("button").props.onClick());
    expect(mocks.navigate).toHaveBeenCalledWith("/installer/" + dnpName);
  });
});
