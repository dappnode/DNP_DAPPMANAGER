import React, { useEffect, useMemo, useState } from "react";
import { useApi, api } from "api";
import { Search } from "lucide-react";
import { Input } from "components/primitives/input";
import { Badge } from "components/primitives/badge";
import { Card, CardContent } from "components/primitives/card";
import { Skeleton } from "components/primitives/skeleton";
import { TypographyH4 } from "components/primitives/typography";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "components/primitives/pagination";
import { NotificationCard } from "./NotificationCard";

const ITEMS_PER_PAGE = 15;

export function InboxTab() {
  const notifications = useApi.notificationsGetAll();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique categories and mark all as seen
  useEffect(() => {
    if (!notifications.data) {
      setCategories([]);
      return;
    }

    const uniqueCategories = Array.from(new Set(notifications.data.map((n) => n.category).filter(Boolean)));
    setCategories(uniqueCategories);
    api.notificationsSetAllSeen();
  }, [notifications.data]);

  // Filter by search + category
  const filteredNotifications = useMemo(() => {
    if (!notifications.data) return [];

    const healthy = notifications.data.filter((n) => !n.errors);

    return healthy.filter(
      (n) =>
        (n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.dnpName.toLowerCase().includes(search.toLowerCase())) &&
        (!selectedCategory || n.category === selectedCategory)
    );
  }, [search, notifications.data, selectedCategory]);

  // Split into new / seen
  const newNotifications = filteredNotifications
    .filter((n) => !n.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const seenNotifications = filteredNotifications
    .filter((n) => n.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalPages = Math.ceil(seenNotifications.length / ITEMS_PER_PAGE);

  const paginatedSeen = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return seenNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [seenNotifications, currentPage]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  /* ── Loading state ─────────────────────────────────────────────────── */

  if (notifications.isValidating && !notifications.data) {
    return (
      <div className="tw:space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="tw:h-20 tw:w-full tw:rounded-xl" />
        ))}
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <div className="tw:space-y-6">
      {/* Search + category filters */}
      <div className="tw:space-y-3">
        <div className="tw:relative">
          <Search className="tw:absolute tw:left-3 tw:top-1/2 tw:-translate-y-1/2 tw:size-4 tw:text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by package name or notification title…"
            className="tw:pl-9"
          />
        </div>

        {categories.length > 0 && (
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="tw:cursor-pointer"
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* New notifications */}
      {newNotifications.length > 0 && (
        <div className="tw:space-y-2">
          <TypographyH4>New Notifications</TypographyH4>
          {newNotifications.map((n) => (
            <NotificationCard key={n.id} notification={n} openByDefault />
          ))}
        </div>
      )}

      {/* History */}
      <div className="tw:space-y-2">
        <TypographyH4>History</TypographyH4>

        {seenNotifications.length === 0 ? (
          <Card>
            <CardContent className="tw:py-8 tw:text-center tw:text-muted-foreground">No notifications</CardContent>
          </Card>
        ) : (
          <>
            {paginatedSeen.map((n) => (
              <NotificationCard key={n.id} notification={n} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={currentPage === 1 ? "tw:pointer-events-none tw:opacity-50" : ""}
                    />
                  </PaginationItem>

                  {/* First page */}
                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Previous page */}
                  {currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => p - 1);
                        }}
                      >
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Current page */}
                  <PaginationItem>
                    <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                      {currentPage}
                    </PaginationLink>
                  </PaginationItem>

                  {/* Next page */}
                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => p + 1);
                        }}
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Last page */}
                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                      }}
                      className={currentPage === totalPages ? "tw:pointer-events-none tw:opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
}
