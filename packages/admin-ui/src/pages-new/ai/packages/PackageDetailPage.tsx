import React from "react";
import { useParams, NavLink, Routes, Route, Navigate } from "react-router-dom";
import { useApi } from "api";
import { isEmpty } from "lodash-es";
import { prettyDnpName } from "utils/format";
import { InstalledPackageDetailData } from "@dappnode/types";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Button } from "components/primitives/button";
import { TypographyH3 } from "components/primitives/typography";
import { ArrowLeft, TriangleAlert, ArrowUpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "img/defaultAvatar.png";

import { InfoTab } from "./tabs/InfoTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { LogsTab } from "./tabs/LogsTab";
import { NetworkTab } from "./tabs/NetworkTab";
import { FileManagerTab } from "./tabs/FileManagerTab";
import { BackupTab } from "./tabs/BackupTab";
import { packagesRelativePath } from "./data";

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

/* ── Component ──────────────────────────────────────────────────────── */

export function PackageDetailPage() {
  const params = useParams();
  const id = params.id || "";
  const navigate = useNavigate();

  const dnpRequest = useApi.packageGet({ dnpName: id });
  const dnp = dnpRequest.data;

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (!dnp && dnpRequest.isValidating) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
        <Skeleton className="tw:h-8 tw:w-48" />
        <Skeleton className="tw:h-10 tw:w-full" />
        <Skeleton className="tw:h-96 tw:w-full tw:rounded-xl" />
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────── */
  if (!dnp) {
    const notFound = dnpRequest.error?.message?.includes("package not found");
    return (
      <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
        <BackButton />
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>{notFound ? "Package not found" : "Error"}</AlertTitle>
          <AlertDescription>
            {notFound
              ? `The package "${prettyDnpName(id)}" is not installed.`
              : dnpRequest.error?.message || "Failed to load package."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableTabs = tabDefs.filter((t) => t.available(dnp));

  return (
    <div className="tw:flex tw:flex-col tw:gap-6 tw:px-page-x tw:py-page-y">
      {/* Back + title */}
      <div className="tw:flex tw:flex-col tw:gap-3">
        <BackButton />
        <div className="tw:flex tw:items-center tw:gap-3">
          <img
            src={dnp.avatarUrl || defaultAvatar}
            alt=""
            className="tw:size-10 tw:rounded-lg tw:bg-muted tw:object-cover"
          />
          <div>
            <TypographyH3 className="tw:border-none tw:pb-0 tw:mb-0">{prettyDnpName(dnp.dnpName)}</TypographyH3>
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
              onClick={() => navigate(`/ai/install/${encodeURIComponent(dnp.dnpName)}`)}
            >
              Update
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tab navbar */}
      <nav className="tw:flex tw:items-center tw:gap-1 tw:border-b tw:border-border tw:-mb-px">
        {availableTabs.map((tab) => (
          <NavLink
            key={tab.subPath}
            to={tab.subPath}
            end
            className={({ isActive }) =>
              [
                "tw:px-4 tw:py-2.5 tw:text-sm tw:font-medium tw:transition-colors tw:border-b-2 tw:whitespace-nowrap",
                isActive
                  ? "tw:border-primary tw:text-primary"
                  : "tw:border-transparent tw:text-muted-foreground tw:hover:text-foreground tw:hover:border-border"
              ].join(" ")
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Tab content */}
      <Routes>
        {availableTabs.map((tab) => (
          <Route key={tab.subPath} path={tab.subPath} element={tab.render(dnp)} />
        ))}
        {/* Default redirect to first available tab */}
        <Route path="*" element={<Navigate to={availableTabs[0]?.subPath || "info"} replace />} />
      </Routes>
    </div>
  );
}

/* ── Back button ────────────────────────────────────────────────────── */

function BackButton() {
  const navigate = useNavigate();
  return (
    <Button variant="link" onClick={() => navigate(packagesRelativePath)} className="tw:inline-flex tw:self-start">
      <ArrowLeft className="tw:size-3.5" />
      Packages
    </Button>
  );
}
