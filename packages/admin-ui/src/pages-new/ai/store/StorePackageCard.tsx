import React from "react";
import { DirectoryItemOk } from "@dappnode/types";
import { ClickableCard, CardHeader, CardContent, CardFooter } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { TypographyMuted } from "components/primitives/typography";
import defaultAvatar from "img/defaultAvatar.png";
import { prettyDnpName } from "utils/format";

/**
 * A package card for the AI Store grid.
 *
 * Displays the package avatar, name, description, install status badge,
 * and categories. The entire card is clickable.
 */
export function StorePackageCard({ item, onClick }: { item: DirectoryItemOk; onClick: () => void }) {
  console.log("Rendering StorePackageCard for", item.name, item.description);

  return (
    <ClickableCard onClick={onClick} size="sm">
      <CardHeader>
        <div className="tw:flex tw:items-center tw:gap-3">
          <img
            src={item.avatarUrl || defaultAvatar}
            alt={`${item.name} avatar`}
            className="tw:size-10 tw:shrink-0 tw:rounded-lg tw:object-cover tw:bg-muted"
          />
          <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
            <span className="tw:text-sm tw:font-semibold tw:leading-snug tw:truncate tw:text-foreground">
              {prettyDnpName(item.name)}
            </span>
            <TypographyMuted className="tw:truncate">{item.name}</TypographyMuted>
          </div>
        </div>
      </CardHeader>

      {item.description && (
        <CardContent>
          <p className="tw:text-sm tw:leading-relaxed tw:text-muted-foreground tw:line-clamp-2">{item.description}</p>
        </CardContent>
      )}
      <CardFooter className="tw:flex tw:items-center tw:justify-between tw:gap-2">
        <div className="tw:flex tw:flex-wrap tw:gap-1">
          {item.categories.map((cat) => (
            <Badge key={cat} variant="secondary" className="tw:text-[10px]">
              {cat}
            </Badge>
          ))}
        </div>
        <StatusBadge isInstalled={item.isInstalled} isUpdated={item.isUpdated} />
      </CardFooter>
    </ClickableCard>
  );
}

/**
 * Small badge indicating whether the package can be installed, updated, or is
 * already up-to-date.
 */
function StatusBadge({ isInstalled, isUpdated }: { isInstalled: boolean; isUpdated: boolean }) {
  if (isUpdated) {
    return <Badge variant="success">Up to date</Badge>;
  }
  if (isInstalled) {
    return <Badge variant="caution">Update</Badge>;
  }
  return <Badge variant="outline">Get</Badge>;
}
