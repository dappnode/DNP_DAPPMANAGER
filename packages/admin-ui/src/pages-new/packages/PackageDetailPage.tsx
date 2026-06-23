import React from "react";
import { useParams, NavLink, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useApi } from "api";
import { isEmpty } from "lodash-es";
import { prettyDnpName } from "utils/format";
import { InstalledPackageDetailData } from "@dappnode/types";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Button } from "components/primitives/button";
import { PageContainer, PageTitle } from "components/primitives/page";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink
} from "components/primitives/navigation-menu";
import { ArrowLeft, TriangleAlert, ArrowUpCircle } from "lucide-react";
import defaultAvatar from "img/defaultAvatar.png";

import { InfoTab } from "pages-new/ai/packages/tabs/info";
import { ConfigTab } from "pages-new/ai/packages/tabs/ConfigTab";
import { LogsTab } from "pages-new/ai/packages/tabs/LogsTab";
import { NetworkTab } from "pages-new/ai/packages/tabs/network";
import { FileManagerTab } from "pages-new/ai/packages/tabs/FileManagerTab";
import { BackupTab } from "pages-new/ai/packages/tabs/BackupTab";
import { PackagesConfig } from "./config";

/* ── Tab definitions ────────────────────────────────────────────────── */

interface TabDef {
  label: string;
  subPath: string;
  render: (dnp: InstalledPackageDetailData) => React.ReactNode;
  available: (dnp: InstalledPackageDetailData) => boolean;
}

const tabDefs: TabDef[] = [
  {
    label: "Info",
    subPath: "info",
    render: (dnp) => <InfoTab dnp={dnp} />,
    available: () => true
  },
  {
    label: "Config",
    subPath: "config",
    render: (dnp) => <ConfigTab dnpName={dnp.dnpName} setupWizard={dnp.setupWizard} userSettings={dnp.userSettings} />,
    available: (dnp) => Boolean(dnp.userSettings && !isEmpty(dnp.userSettings.environment))
  },
  {
    label: "Network",
    subPath: "network",
    render: (dnp) => <NetworkTab containers={dnp.containers} />,
    available: (dnp) => dnp.dnpName !== "dappmanager.dnp.dappnode.eth"
  },
  {
    label: "Logs",
    subPath: "logs",
    render: (dnp) => <LogsTab containers={dnp.containers} />,
    available: () => true
  },
  {
    label: "Backup",
    subPath: "backup",
    render: (dnp) => <BackupTab dnpName={dnp.dnpName} backup={dnp.backup || []} />,
    available: (dnp) => (dnp.backup || []).length > 0
  },
  {
    label: "File Manager",
    subPath: "file-manager",
    render: (dnp) => <FileManagerTab containers={dnp.containers} />,
    available: () => true
  }
];

/* ── Props ──────────────────────────────────────────────────────────── */

interface PackageDetailPageProps {
  config: PackagesConfig;
}

/* ── Component ──────────────────────────────────────────────────────── */

export function PackageDetailPage({ config }: PackageDetailPageProps) {
  const params = useParams();
  const id = params.id || "";
  const navigate = useNavigate();

  const dnpRequest = useApi.packageGet({ dnpName: id });
  const dnp = dnpRequest.data;

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (!dnp && dnpRequest.isValidating) {
    return (
      <PageContainer>
        <Skeleton className="tw:h-8 tw:w-48" />
        <Skeleton className="tw:h-10 tw:w-full" />
        <Skeleton className="tw:h-96 tw:w-full tw:rounded-xl" />
      </PageContainer>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (!dnp) {
    const notFound = dnpRequest.error?.message?.includes("package not found");
    return (
      <PageContainer>
        <BackButton packagesPath={config.packagesPath} />
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>{notFound ? "Package not found" : "Error"}</AlertTitle>
          <AlertDescription>
            {notFound
              ? `The package "${prettyDnpName(id)}" is not installed.`
              : dnpRequest.error?.message || "Failed to load package."}
          </AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  const availableTabs = tabDefs.filter((t) => t.available(dnp));

  return (
    <PageContainer className="tw:gap-6">
      {/* Back + title */}
      <div className="tw:flex tw:flex-col tw:gap-3">
        <BackButton packagesPath={config.packagesPath} />
        <div className="tw:flex tw:items-center tw:gap-3">
          <img
            src={dnp.avatarUrl || defaultAvatar}
            alt=""
            className="tw:size-10 tw:rounded-lg tw:bg-muted tw:object-cover"
          />
          <div>
            <PageTitle>{prettyDnpName(dnp.dnpName)}</PageTitle>
            <span className="tw:text-sm tw:text-muted-foreground">v{dnp.version}</span>
          </div>
        </div>
      </div>

      {/* Update available banner */}
      {dnp.updateAvailable && (
        <Alert>
          <ArrowUpCircle className="tw:size-4" />
          <AlertTitle>Update available</AlertTitle>
          <AlertDescription className="tw:flex tw:items-center tw:gap-3">
            <span>
              Version {dnp.updateAvailable.newVersion}
              {dnp.updateAvailable.upstreamVersion && ` (${dnp.updateAvailable.upstreamVersion} upstream)`}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`${config.installerPath}/${encodeURIComponent(dnp.dnpName)}`)}
            >
              Update
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tab navbar */}
      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          {availableTabs.map((tab) => (
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
        {availableTabs.map((tab) => (
          <Route key={tab.subPath} path={tab.subPath} element={tab.render(dnp)} />
        ))}
        <Route path="*" element={<Navigate to={availableTabs[0]?.subPath || "info"} replace />} />
      </Routes>
    </PageContainer>
  );
}

/* ── Back button ────────────────────────────────────────────────────── */

function BackButton({ packagesPath }: { packagesPath: string }) {
  const navigate = useNavigate();
  return (
    <Button variant="link" onClick={() => navigate(packagesPath)} className="tw:inline-flex tw:self-start">
      <ArrowLeft className="tw:size-3.5" />
      Packages
    </Button>
  );
}
