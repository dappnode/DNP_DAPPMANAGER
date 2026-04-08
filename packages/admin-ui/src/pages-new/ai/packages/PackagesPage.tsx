import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "api";
import { sortBy } from "lodash-es";
import { prettyDnpName } from "utils/format";
import { ClickableCard, CardHeader, CardTitle, CardDescription, CardContent } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "components/primitives/empty";
import { Skeleton } from "components/primitives/skeleton";
import { PageContainer, PageHeader } from "components/primitives/page";
import { CircleCheck, CirclePause, CircleX, RefreshCw, TriangleAlert, PackageOpen } from "lucide-react";
import { InstalledPackageDataApiReturn } from "@dappnode/types";
import { parseContainerState, SimpleState } from "pages/packages/components/StateBadge/utils";
import defaultAvatar from "img/defaultAvatar.png";
import { Button } from "components/primitives/button";
import { storeRelativePath } from "../store/data";

/* ── Status helpers ─────────────────────────────────────────────────── */

const statusIcon: Record<SimpleState, React.ReactNode> = {
  running: <CircleCheck className="tw:size-3.5" />,
  stopped: <CirclePause className="tw:size-3.5" />,
  crashed: <CircleX className="tw:size-3.5" />,
  restarting: <RefreshCw className="tw:size-3.5 tw:animate-spin" />,
  removing: <CirclePause className="tw:size-3.5" />
};

const statusClass: Record<SimpleState, string> = {
  running: "tw:text-green-600 tw:dark:text-green-400",
  stopped: "tw:text-muted-foreground",
  crashed: "tw:text-destructive",
  restarting: "tw:text-amber-500",
  removing: "tw:text-muted-foreground"
};

function getAggregateState(dnp: InstalledPackageDataApiReturn): SimpleState {
  const states = dnp.containers.map((c) => parseContainerState(c).state);
  if (states.includes("crashed")) return "crashed";
  if (states.includes("restarting")) return "restarting";
  if (states.every((s) => s === "stopped")) return "stopped";
  return "running";
}

/* ── Component ──────────────────────────────────────────────────────── */

export function PackagesPage() {
  const navigate = useNavigate();
  const dnpsRequest = useApi.packagesGet();
  const dnps = dnpsRequest.data;
  const error = dnpsRequest.error;
  const loading = dnpsRequest.isValidating && !dnps;

  /** Only AI-category packages (non-core && categories include "AI"). */
  const packages = useMemo(() => {
    if (!dnps) return [];
    return sortBy(
      dnps.filter((d) => !d.isCore && d.categories?.includes("AI")),
      (d) => d.dnpName
    );
  }, [dnps]);

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          title="Packages"
          description="View and manage the AI packages installed on your Dappnode. Monitor the status, versions and updates."
        />
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-card">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="tw:h-36 tw:rounded-xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader
          title="Packages"
          description="View and manage the AI packages installed on your Dappnode. Monitor the status, versions and updates."
        />
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>Failed to load packages</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Packages"
        description="View and manage the AI packages installed on your Dappnode. Monitor the status, versions and updates."
      />

      {packages.length === 0 ? (
        <Empty className="tw:border tw:py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyTitle>No packages installed</EmptyTitle>
            <EmptyDescription>Head over to the Store to install your first AI package.</EmptyDescription>
            <Button variant="link" onClick={() => navigate(storeRelativePath)}>
              Go to Store
            </Button>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-card">
          {packages.map((dnp) => {
            const state = getAggregateState(dnp);
            const prettyName = prettyDnpName(dnp.dnpName);
            return (
              <ClickableCard
                key={dnp.dnpName}
                className="tw:group"
                onClick={() => navigate(`${encodeURIComponent(dnp.dnpName)}/info`)}
              >
                <CardHeader className="tw:flex tw:flex-row tw:items-start tw:gap-3 tw:space-y-0">
                  <img
                    src={dnp.avatarUrl || defaultAvatar}
                    alt=""
                    className="tw:size-10 tw:rounded-lg tw:bg-muted tw:object-cover"
                  />
                  <div className="tw:flex-1 tw:min-w-0">
                    <CardTitle className="tw:truncate">{prettyName}</CardTitle>
                    <CardDescription className="tw:mt-0.5">v{dnp.version}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="tw:flex tw:items-center tw:justify-between tw:pt-0">
                  <div className={`tw:flex tw:items-center tw:gap-1.5 tw:text-sm tw:font-medium ${statusClass[state]}`}>
                    {statusIcon[state]}
                    <span className="tw:capitalize">{state}</span>
                  </div>
                  {dnp.updateAvailable && (
                    <Badge variant="outline" className="tw:text-xs">
                      Update available
                    </Badge>
                  )}
                </CardContent>
              </ClickableCard>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
