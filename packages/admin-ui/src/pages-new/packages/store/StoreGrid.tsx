import React from "react";
import { DirectoryItemOk } from "@dappnode/types";
import { StorePackageCard } from "./StorePackageCard";

export function StoreGrid({
  packages,
  onPackageClick
}: {
  packages: DirectoryItemOk[];
  onPackageClick: (item: DirectoryItemOk) => void;
}) {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-card">
      {packages.map((item) => (
        <StorePackageCard key={item.name} item={item} onClick={() => onPackageClick(item)} />
      ))}
    </div>
  );
}
