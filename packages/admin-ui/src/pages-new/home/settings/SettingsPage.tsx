import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { PageContainer, PageHeader } from "components/primitives/page";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "components/primitives/navigation-menu";
import { InfoTab, WifiTab, VpnTab, UpdatesTab, AppTab, ProfileTab, HostTab, NetworkTab, IpfsTab, AdvancedTab } from ".";

/* ── Tab definitions ────────────────────────────────────────────────── */

interface SettingsTabDef {
  label: string;
  /** Route path pattern (may include wildcard for nested routes) */
  subPath: string;
  /** Clean path for the NavLink (no wildcard). Defaults to subPath. */
  navPath?: string;
  element: React.ReactNode;
}

const tabs: SettingsTabDef[] = [
  { label: "Info", subPath: "info", element: <InfoTab /> },
  { label: "WiFi", subPath: "wifi", element: <WifiTab /> },
  { label: "VPN", subPath: "vpn/*", navPath: "vpn", element: <VpnTab /> },
  { label: "Updates", subPath: "updates", element: <UpdatesTab /> },
  { label: "App", subPath: "app", element: <AppTab /> },
  { label: "Profile", subPath: "profile", element: <ProfileTab /> },
  { label: "Host", subPath: "host", element: <HostTab /> },
  { label: "Network", subPath: "network", element: <NetworkTab /> },
  { label: "IPFS", subPath: "ipfs", element: <IpfsTab /> },
  { label: "Advanced", subPath: "advanced", element: <AdvancedTab /> }
];

/**
 * Settings page — comprehensive system management with tab navigation.
 *
 * Houses all legacy system/support functionality, rebuilt with shadcn primitives.
 * Each tab is its own route under `/settings/*`.
 */
export function SettingsPage() {
  const defaultTab = tabs[0]?.navPath ?? tabs[0]?.subPath ?? "info";

  return (
    <PageContainer className="tw:gap-6">
      <PageHeader
        title="Settings"
        description="Manage your Dappnode system configuration, security, network, and more."
      />

      {/* Tab navigation */}
      <NavigationMenu viewport={false}>
        <NavigationMenuList className="tw:flex-wrap">
          {tabs.map((tab) => (
            <NavigationMenuItem key={tab.subPath}>
              <NavigationMenuLink asChild>
                <NavLink to={tab.navPath ?? tab.subPath}>{tab.label}</NavLink>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      {/* Tab content */}
      <Routes>
        {tabs.map((tab) => (
          <Route key={tab.subPath} path={tab.subPath} element={tab.element} />
        ))}
        <Route path="*" element={<Navigate to={defaultTab} replace />} />
      </Routes>
    </PageContainer>
  );
}
