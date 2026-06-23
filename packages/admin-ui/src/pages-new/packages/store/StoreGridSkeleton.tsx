import React from "react";
import { Card, CardHeader, CardContent, CardFooter } from "components/primitives/card";
import { Skeleton } from "components/primitives/skeleton";

/**
 * Skeleton placeholder matching the shape of `StorePackageCard`.
 * Rendered while the directory is loading.
 */
export function StorePackageCardSkeleton() {
  return (
    <Card size="sm">
      <CardHeader>
        <div className="tw:flex tw:items-center tw:gap-3">
          <Skeleton className="tw:size-10 tw:rounded-lg" />
          <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-1.5">
            <Skeleton className="tw:h-4 tw:w-28" />
            <Skeleton className="tw:h-3 tw:w-40" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <Skeleton className="tw:h-3.5 tw:w-full" />
          <Skeleton className="tw:h-3.5 tw:w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="tw:flex tw:items-center tw:justify-between">
        <div className="tw:flex tw:gap-1">
          <Skeleton className="tw:h-5 tw:w-10 tw:rounded-full" />
          <Skeleton className="tw:h-5 tw:w-12 tw:rounded-full" />
        </div>
        <Skeleton className="tw:h-5 tw:w-14 tw:rounded-full" />
      </CardFooter>
    </Card>
  );
}

/**
 * A grid of skeleton cards used as the loading state for the Store page.
 *
 * @param count Number of skeleton cards to render. Defaults to 6.
 */
export function StoreGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:lg:grid-cols-3 tw:gap-card">
      {Array.from({ length: count }).map((_, i) => (
        <StorePackageCardSkeleton key={i} />
      ))}
    </div>
  );
}
