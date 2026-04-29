import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { DirectoryItemOk } from "@dappnode/types";
import { getDnpDirectory, getDirectoryRequestStatus } from "services/dnpDirectory/selectors";
import { fetchDnpDirectory } from "services/dnpDirectory/actions";
import { PageContainer, PageHeader } from "components/primitives/page";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "components/primitives/empty";
import { SearchBar } from "components/primitives/search";
import { PackageOpen, TriangleAlert } from "lucide-react";
import isIpfsHash from "utils/isIpfsHash";
import isDnpDomain from "utils/isDnpDomain";
import { correctPackageName } from "pages/installer/utils";
import { StoreGrid } from "./StoreGrid";
import { StoreGridSkeleton } from "./StoreGridSkeleton";
import { PackagesConfig, matchesDirectoryFilter } from "../config";

interface StorePageProps {
  config: PackagesConfig;
}

export function StorePage({ config }: StorePageProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const directory = useSelector(getDnpDirectory);
  const requestStatus = useSelector(getDirectoryRequestStatus);

  const [search, setSearch] = useState("");
  const trimmedSearch = search.trim();

  useEffect(() => {
    dispatch(fetchDnpDirectory());
  }, [dispatch]);

  const filteredPackages = useMemo<DirectoryItemOk[]>(() => {
    const sectionPackages = directory.filter(
      (item): item is DirectoryItemOk => item.status === "ok" && matchesDirectoryFilter(item, config.categoryFilter)
    );

    const query = trimmedSearch.toLowerCase();
    if (!query) return sectionPackages;

    return sectionPackages.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description ?? "").toLowerCase().includes(query) ||
        item.categories.some((cat) => cat.toLowerCase().includes(query))
    );
  }, [directory, config.categoryFilter, trimmedSearch]);

  const cleanedQuery = useMemo(() => correctPackageName(trimmedSearch), [trimmedSearch]);

  const enterHint = useMemo(
    () => cleanedQuery && (isIpfsHash(cleanedQuery) || isDnpDomain(cleanedQuery) || filteredPackages.length === 1),
    [cleanedQuery, filteredPackages.length]
  );

  function handlePackageClick(item: DirectoryItemOk) {
    const encodedName = encodeURIComponent(item.name);
    if (item.isUpdated) {
      navigate(`${config.packagesPath}/${encodedName}/info`);
    } else {
      navigate(`${config.installerPath}/${encodedName}`);
    }
  }

  function runQuery() {
    if (!cleanedQuery) return;
    if (isIpfsHash(cleanedQuery) || isDnpDomain(cleanedQuery)) {
      navigate(`${config.installerPath}/${encodeURIComponent(cleanedQuery)}`);
      return;
    }
    if (filteredPackages.length === 1) {
      handlePackageClick(filteredPackages[0]);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${config.sectionLabel} Store`}
        description={`Browse and install ${config.sectionLabel} packages on your Dappnode.`}
      />

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onEnter={runQuery}
        placeholder="Search packages — or paste a DNP name / IPFS hash and press Enter"
        showEnterHint={!!enterHint}
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
              {trimmedSearch
                ? `No packages match "${trimmedSearch}". Try a different search.`
                : "There are no matching packages in the Dappnode directory yet. Check back soon!"}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <StoreGrid packages={filteredPackages} onPackageClick={handlePackageClick} />
      )}
    </PageContainer>
  );
}
