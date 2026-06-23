import React from "react";
import { DirectoryItemOk } from "@dappnode/types";
import { ClickableCard, CardHeader, CardContent, CardFooter } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { TypographyMuted } from "components/primitives/typography";
import defaultAvatar from "img/defaultAvatar.png";
import { prettyDnpName } from "utils/format";
import { CheckCircle, ArrowUpCircle, Download } from "lucide-react";

/**
 * A package card for the AI Store grid.
 *
 * Displays the package avatar, name, description, install status badge,
 * and categories. The entire card is clickable.
 */
export function StorePackageCard({ item, onClick }: { item: DirectoryItemOk; onClick: () => void }) {
  return (
    <ClickableCard onClick={onClick} size="sm" className="tw:justify-between">
      <CardHeader>
        <div className="tw:flex tw:items-center tw:gap-3">
          <img
            src={item.avatarUrl || defaultAvatar}
            alt={`${item.name} avatar`}
            className="tw:size-10 tw:shrink-0 tw:rounded-lg tw:object-cover tw:bg-muted"
          />
          <div className="tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0 tw:flex-1">
            <span className="tw:text-sm tw:font-semibold tw:leading-snug tw:truncate tw:text-foreground">
              {prettyDnpName(item.name)}
            </span>
            <TypographyMuted className="tw:truncate">{item.name}</TypographyMuted>
          </div>
          <StatusIndicator isInstalled={item.isInstalled} isUpdated={item.isUpdated} />
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

function StatusIndicator({ isInstalled, isUpdated }: { isInstalled: boolean; isUpdated: boolean }) {
  if (isUpdated) {
    return (
      <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-success/15">
        <CheckCircle className="tw:size-4 tw:text-success" />
      </div>
    );
  }
  if (isInstalled) {
    return (
      <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-caution/15">
        <ArrowUpCircle className="tw:size-4 tw:text-caution" />
      </div>
    );
  }
  return (
    <div className="tw:flex tw:size-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-primary/10">
      <Download className="tw:size-4 tw:text-primary" />
    </div>
  );
}

/**
 * Small text badge in the footer reinforcing the status.
 */
function StatusBadge({ isInstalled, isUpdated }: { isInstalled: boolean; isUpdated: boolean }) {
  if (isUpdated) {
    return <Badge variant="success">Up to date</Badge>;
  }
  if (isInstalled) {
    return <Badge variant="caution">Update available</Badge>;
  }
  return <Badge variant="outline">Install</Badge>;
}
