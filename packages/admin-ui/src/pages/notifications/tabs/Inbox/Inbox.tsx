import SubTitle from "components/SubTitle";
import React, { useEffect, useMemo, useState } from "react";
import Card from "components/Card";
import { NotificationCard } from "./NotificationsCard";
import { useApi, api } from "api";
import { Searchbar } from "components/Searchbar";
import Loading from "components/Loading";
import "./inbox.scss";

export function Inbox() {
  const notifications = useApi.notificationsGetAll();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    if (!notifications.data) {
      setCategories([]);
      return;
    }

    const uniqueCategories = Array.from(new Set(notifications.data.map((n) => n.category).filter(Boolean)));
    setCategories(uniqueCategories);
    api.notificationsSetAllSeen();
  }, [notifications.data]);

  const filteredNotifications = useMemo(() => {
    if (!notifications.data) return [];

    // Filter notifications that encountered an error while making the request
    const healthyNotifications = notifications.data.filter((notification) => !notification.errors);

    // Filter by search and category
    return healthyNotifications.filter(
      (notification) =>
        (notification.title.toLowerCase().includes(search.toLowerCase()) ||
          notification.dnpName.toLowerCase().includes(search.toLowerCase())) &&
        (!selectedCategory || notification.category === selectedCategory)
    );
  }, [search, notifications.data, selectedCategory]);

  const newNotifications = filteredNotifications
    .filter((notification) => !notification.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const seenNotifications = filteredNotifications
    .filter((notification) => notification.seen)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const totalPages = Math.ceil(seenNotifications.length / itemsPerPage);

  const paginatedSeenNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return seenNotifications.slice(startIndex, endIndex);
  }, [seenNotifications, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
  };

  const loading = notifications.isValidating;

  return loading ? (
    <Loading steps={["Loading data"]} />
  ) : (
    <>
      <div>
        <Searchbar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by package name or notification title..."
        />

        {categories.length > 0 && (
          <div className="categories">
            {categories.map((category) => (
              <div
                key={category}
                className={`category ${selectedCategory === category ? "selected" : ""}`}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              >
                {category}
              </div>
            ))}
          </div>
        )}
      </div>

      {newNotifications.length > 0 && (
        <>
          <SubTitle>New Notifications</SubTitle>
          {newNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} openByDefault />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {!seenNotifications || seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        <>
          {paginatedSeenNotifications.map((notification) => (
            <NotificationCard key={notification.timestamp} notification={notification} />
          ))}
          {totalPages > 1 && (
            <div className="pagination">
              {currentPage !== 1 && (
                <>
                  <button onClick={handleFirstPage} className="page-item">
                    1
                  </button>
                  {currentPage > 3 && <span className="dots">. . .</span>}
                </>
              )}

              {currentPage > 2 && (
                <button onClick={handlePreviousPage} className="page-item">
                  {currentPage - 1}
                </button>
              )}
              <span className="active">{currentPage}</span>
              {totalPages - 1 > currentPage && (
                <button onClick={handleNextPage} className="page-item">
                  {currentPage + 1}
                </button>
              )}

              {currentPage !== totalPages && (
                <>
                  {totalPages - 2 > currentPage && <span className="dots">. . .</span>}
                  <button onClick={handleLastPage} className="page-item">
                    {totalPages}
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
