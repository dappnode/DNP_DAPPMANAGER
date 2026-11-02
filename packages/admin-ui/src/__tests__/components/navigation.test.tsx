import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionNavigator } from "../../components/SectionNavigator";
import { PackagesNavigator } from "../../pages/packages/components/PackagesNavigator";
import { InstallerNavigator } from "../../pages/installer/components/InstallerNavigator";

vi.mock("api", () => ({
  useApi: { packagesGet: () => ({ data: [{ dnpName: "custom.dnp.dappnode.eth", isDev: true }] }) }
}));
vi.mock("pages/packages/components/PackagesList", () => ({
  PackagesList: () => <p>Package list</p>
}));
vi.mock("pages/packages/pages/ById", () => ({
  PackageById: () => <p>Package: {useParams().id}</p>
}));
vi.mock("pages/installer/components/InstallDnpContainer", () => ({
  default: () => <p>Install: {useParams().id}</p>
}));
vi.mock("pages/installer/components/dappnodeDappstore/InstallerDnp", () => ({
  InstallerDnp: () => <p>Dnp store</p>
}));
vi.mock("pages/installer/components/publicDappstore/InstallerPublic", () => ({
  InstallerPublic: () => <p>Public store</p>
}));
vi.mock("components/ConfirmDialog", () => ({ confirm: vi.fn() }));

let renderer: ReactTestRenderer | undefined;
function CurrentPath() {
  return <output>{useLocation().pathname}</output>;
}
function render(path: string, root: string, element: React.ReactElement) {
  act(() => {
    renderer = create(
      <MemoryRouter initialEntries={[path]}>
        <CurrentPath />
        <Routes>
          <Route path={root} element={element} />
        </Routes>
      </MemoryRouter>
    );
  });
  return renderer!;
}
afterEach(() => {
  if (renderer) act(() => renderer?.unmount());
});

const sections = [
  { name: "Info", subPath: "info", element: <p>Info</p> },
  { name: "Network", subPath: "network", element: <p>Network</p> }
];

describe("navigation between sibling tabs", () => {
  it("opens System packages from My packages without requesting a package named system", () => {
    const app = render("/packages/my", "packages/*", <PackagesNavigator />);
    const link = app.root.findAllByType("a").find((node) => node.children.includes("SYSTEM PACKAGES"))!;
    expect(link.props.href).toBe("/packages/system");
    act(() => link.props.onClick({ button: 0, defaultPrevented: false, preventDefault: vi.fn() }));
    expect(app.root.findByType("output").children).toEqual(["/packages/system"]);
    expect(JSON.stringify(app.toJSON())).toContain("Package list");
    expect(JSON.stringify(app.toJSON())).not.toContain("Package: ");
  });

  it.each(["my", "system", "custom"])("resolves package scope links from /packages/%s", (scope) => {
    const app = render(`/packages/${scope}`, "packages/*", <PackagesNavigator />);
    expect(app.root.findAllByType("a").map((node) => node.props.href)).toEqual([
      "/packages/my",
      "/packages/custom",
      "/packages/system"
    ]);
  });

  it.each(["system", "vpn", "notifications"])("keeps %s section tabs relative to the section root", (section) => {
    const app = render(
      `/${section}/info`,
      `${section}/*`,
      <SectionNavigator basePath={`/${section}`} routes={sections} />
    );
    expect(app.root.findAllByType("a").map((node) => node.props.href)).toEqual([
      `/${section}/info`,
      `/${section}/network`
    ]);
  });

  it.each(["dnp", "public"])("resolves store tabs from /installer/%s", (store) => {
    const app = render(`/installer/${store}`, "installer/*", <InstallerNavigator />);
    expect(app.root.findAllByType("a").map((node) => node.props.href)).toEqual(["/installer/dnp", "/installer/public"]);
  });

  it("keeps nested premium tabs within the backup section", () => {
    const routes = [
      { name: "Ethereum", subPath: "ethereum", element: <p>Ethereum backup</p> },
      { name: "Gnosis", subPath: "gnosis", element: <p>Gnosis backup</p> }
    ];
    const app = render(
      "/premium/backup-node/ethereum",
      "premium/*",
      <SectionNavigator
        basePath="/premium"
        routes={[
          { name: "Activate", subPath: "activate", element: <p>Activate premium</p> },
          {
            name: "Backup",
            subPath: "backup-node",
            element: <SectionNavigator basePath="/premium/backup-node" routes={routes} />
          }
        ]}
      />
    );
    const gnosis = app.root.findAllByType("a").find((node) => node.children.includes("GNOSIS"))!;
    expect(gnosis.props.href).toBe("/premium/backup-node/gnosis");
    act(() => gnosis.props.onClick({ button: 0, defaultPrevented: false, preventDefault: vi.fn() }));
    expect(app.root.findByType("output").children).toEqual(["/premium/backup-node/gnosis"]);
    expect(JSON.stringify(app.toJSON())).toContain("Gnosis backup");
    const activate = app.root.findAllByType("a").find((node) => node.children.includes("ACTIVATE"))!;
    expect(activate.props.href).toBe("/premium/activate");
  });
});
