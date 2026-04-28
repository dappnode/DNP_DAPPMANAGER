import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DirectoryItemOk } from "@dappnode/types";
import { getDnpDirectory, getDirectoryRequestStatus } from "services/dnpDirectory/selectors";
import { fetchDnpDirectory } from "services/dnpDirectory/actions";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "components/primitives/empty";
import { PackageOpen, TriangleAlert } from "lucide-react";
import { StoreGrid } from "./StoreGrid";
import { StoreGridSkeleton } from "./StoreGridSkeleton";
import { PackagesConfig, matchesDirectoryFilter } from "../config";

interface StorePageProps {
  config: PackagesConfig;
}

/**
 * Shared Store page — displays a grid of DNP packages from the on-chain
 * directory, filtered by the supplied category configuration.
 */
export function StorePage({ config }: StorePageProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const directory = useSelector(getDnpDirectory);
  const requestStatus = useSelector(getDirectoryRequestStatus);

  useEffect(() => {
    dispatch(fetchDnpDirectory());
  }, [dispatch]);

  /** Filter directory items by the section's category config. */
  const filteredPackages = useMemo<DirectoryItemOk[]>(
    () =>
      directory.filter(
        (item): item is DirectoryItemOk => item.status === "ok" && matchesDirectoryFilter(item, config.categoryFilter)
      ),
    [directory, config.categoryFilter]
  );

  function handlePackageClick(item: DirectoryItemOk) {
    const encodedName = encodeURIComponent(item.name);
    if (item.isUpdated) {
      navigate(`${config.packagesPath}/${encodedName}/info`);
    } else {
      navigate(`${config.installerPath}/${encodedName}`);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${config.sectionLabel} Store`}
        description={`Browse and install ${config.sectionLabel} packages on your Dappnode.`}
      />

      {requestStatus.loading && !directory.length ? (
        <StoreGridSkeleton />
      ) : requestStatus.error ? (
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>Failed to load packages</AlertTitle>
          <AlertDescription>{requestStatus.error}</AlertDescription>
        </Alert>
      ) : filteredPackages.length === 0 ? (
        <Empty className="tw:border tw:py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyTitle>No packages found</EmptyTitle>
            <EmptyDescription>
              There are no matching packages in the Dappnode directory yet. Check back soon!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <StoreGrid packages={filteredPackages} onPackageClick={handlePackageClick} />
      )}
    </PageContainer>
  );
}
