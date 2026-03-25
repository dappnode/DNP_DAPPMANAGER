import React from "react";
import { useApi } from "api";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getProgressLogsByDnp } from "services/isInstallingLogs/selectors";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Skeleton } from "components/primitives/skeleton";
import { Spinner } from "components/primitives/spinner";
import { TriangleAlert } from "lucide-react";
import { InstallerView } from "./InstallerView";

/**
 * Container component for the new AI installer page.
 *
 * Reads the `:id` route param, fetches the `RequestedDnp` via the
 * `useApi.fetchDnpRequest` hook and passes it to `InstallerView`.
 */
export function InstallerPage() {
  const { id } = useParams<{ id: string }>();
  const progressLogsByDnp = useSelector(getProgressLogsByDnp);

  if (!id) {
    return (
      <div className="tw:px-page-x tw:py-page-y">
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>Missing package ID</AlertTitle>
          <AlertDescription>No package ID was provided in the URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data: dnp, error } = useApi.fetchDnpRequest({ id });

  const dnpName = dnp?.dnpName;
  const progressLogs = dnpName ? progressLogsByDnp[dnpName] : undefined;

  if (error) {
    return (
      <div className="tw:px-page-x tw:py-page-y">
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>Failed to load package</AlertTitle>
          <AlertDescription>{typeof error === "string" ? error : error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dnp) {
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:gap-6 tw:py-24 tw:px-page-x">
        <Spinner className="tw:size-10 tw:text-primary" />
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-2">
          <p className="tw:text-sm tw:font-medium tw:text-foreground">Loading package…</p>
          <div className="tw:flex tw:flex-col tw:gap-2 tw:w-64">
            <Skeleton className="tw:h-3 tw:w-full tw:rounded-full" />
            <Skeleton className="tw:h-3 tw:w-3/4 tw:rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return <InstallerView dnp={dnp} progressLogs={progressLogs} />;
}
