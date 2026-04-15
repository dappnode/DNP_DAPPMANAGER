import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { useApi } from "api";
import { notificationsDnpName } from "params";
import { PageContainer, PageHeader } from "components/primitives/page";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "components/primitives/navigation-menu";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Skeleton } from "components/primitives/skeleton";
import { AlertCircle } from "lucide-react";
import { InboxTab } from "./InboxTab";
import { SettingsTab } from "./SettingsTab";
import { withLegacyBase } from "utils/path";

/* ── Tab definitions ────────────────────────────────────────────────── */

interface NotificationsTabDef {
  label: string;
  subPath: string;
  element: React.ReactNode;
}

function buildTabs(isInstalled: boolean): NotificationsTabDef[] {
  const installPrompt = <InstallRequired />;

  return [
    { label: "Inbox", subPath: "inbox", element: isInstalled ? <InboxTab /> : installPrompt },
    { label: "Settings", subPath: "settings", element: isInstalled ? <SettingsTab /> : installPrompt },
    { label: "Devices", subPath: "devices", element: isInstalled ? <ComingSoon label="Devices" /> : installPrompt }
  ];
}

/* ── Placeholder components ─────────────────────────────────────────── */

function InstallRequired() {
  return (
    <Card>
      <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-10 tw:text-center">
        <AlertCircle className="tw:size-10 tw:text-muted-foreground" />
        <div className="tw:space-y-1">
          <p className="tw:font-medium">Notifications package not installed</p>
          <p className="tw:text-muted-foreground">
            To receive notifications on your Dappnode, install the Notifications package.
          </p>
        </div>
        <Button asChild>
          <a href={withLegacyBase(`installer/${notificationsDnpName}`)}>Install Package</a>
        </Button>
      </CardContent>
    </Card>
  );
}

function ComingSoon({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:py-10 tw:text-center">
        <p className="tw:font-medium">{label}</p>
        <p className="tw:text-muted-foreground">This tab will be available in a future update.</p>
      </CardContent>
    </Card>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */

export function NotificationsPage() {
  const pkgStatus = useApi.notificationsPackageStatus();

  /* Loading state */
  if (pkgStatus.isValidating && !pkgStatus.data) {
    return (
      <PageContainer className="tw:gap-6">
        <PageHeader title="Notifications" description="View and manage your Dappnode alerts." />
        <div className="tw:space-y-4">
          <Skeleton className="tw:h-10 tw:w-full tw:rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="tw:h-20 tw:w-full tw:rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  /* Error state */
  if (pkgStatus.error) {
    const errorMsg = pkgStatus.error instanceof Error ? pkgStatus.error.message : String(pkgStatus.error);
    return (
      <PageContainer className="tw:gap-6">
        <PageHeader title="Notifications" description="View and manage your Dappnode alerts." />
        <Card>
          <CardContent className="tw:py-8 tw:text-center tw:text-muted-foreground">
            Error loading notifications status: {errorMsg}
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const isInstalled = pkgStatus.data?.isInstalled ?? false;
  const tabs = buildTabs(isInstalled);

  return (
    <PageContainer className="tw:gap-6">
      <PageHeader title="Notifications" description="View and manage your Dappnode alerts." />

      {/* Tab navigation */}
      <NavigationMenu viewport={false}>
        <NavigationMenuList className="tw:flex-wrap">
          {tabs.map((tab) => (
            <NavigationMenuItem key={tab.subPath}>
              <NavigationMenuLink asChild>
                <NavLink to={tab.subPath}>{tab.label}</NavLink>
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
        <Route path="*" element={<Navigate to="inbox" replace />} />
      </Routes>
    </PageContainer>
  );
}
