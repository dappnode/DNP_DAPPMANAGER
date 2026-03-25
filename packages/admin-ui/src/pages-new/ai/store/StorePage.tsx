import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DirectoryItemOk } from "@dappnode/types";
import { getDnpDirectory, getDirectoryRequestStatus } from "services/dnpDirectory/selectors";
import { fetchDnpDirectory } from "services/dnpDirectory/actions";
import { TypographyH3, TypographyMuted } from "components/primitives/typography";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "components/primitives/empty";
import { PackageOpen, TriangleAlert } from "lucide-react";
import { StoreGrid } from "./StoreGrid";
import { StoreGridSkeleton } from "./StoreGridSkeleton";

const AI_CATEGORY = "AI";

/**
 * AI Store page — displays a grid of all DNP packages that belong to the
 * "AI" category, pulled from the on-chain directory via Redux.
 */
export function StorePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const directory = useSelector(getDnpDirectory);
  const requestStatus = useSelector(getDirectoryRequestStatus);

  useEffect(() => {
    dispatch(fetchDnpDirectory());
  }, [dispatch]);

  /** Only keep "ok" packages whose categories include "AI". */
  const aiPackages = useMemo<DirectoryItemOk[]>(
    () =>
      directory.filter(
        (item): item is DirectoryItemOk => item.status === "ok" && item.categories.includes(AI_CATEGORY)
      ),
    [directory]
  );

  function handlePackageClick(item: DirectoryItemOk) {
    const encodedName = encodeURIComponent(item.name);
    if (item.isUpdated) {
      // Already installed & up-to-date → navigate to its detail view
      navigate(`/staking/packages/my/${encodedName}/info`);
    } else {
      // Not installed or updateable → navigate to the new AI installer
      navigate(`/ai/install/${encodedName}`);
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-section tw:px-page-x tw:py-page-y">
      {/* Page header */}
      <header>
        <TypographyH3 className="tw:border-none tw:pb-0">AI Store</TypographyH3>
        <TypographyMuted className="tw:mt-header-gap tw:max-w-2xl">
          Browse and install AI-powered packages from the Dappnode directory.
        </TypographyMuted>
      </header>

      {/* Content area */}
      {requestStatus.loading && !directory.length ? (
        <StoreGridSkeleton />
      ) : requestStatus.error ? (
        <Alert variant="destructive">
          <TriangleAlert className="tw:size-4" />
          <AlertTitle>Failed to load packages</AlertTitle>
          <AlertDescription>{requestStatus.error}</AlertDescription>
        </Alert>
      ) : aiPackages.length === 0 ? (
        <Empty className="tw:border tw:py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyTitle>No AI packages found</EmptyTitle>
            <EmptyDescription>
              There are no packages with the "AI" category in the Dappnode directory yet. Check back soon!
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <StoreGrid packages={aiPackages} onPackageClick={handlePackageClick} />
      )}
    </div>
  );
}
