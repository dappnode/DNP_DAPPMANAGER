import SubTitle from "components/SubTitle";
import React, { useEffect, useMemo, useState } from "react";
import Card from "components/Card";
import "./inbox.scss";
import { NotificationCard } from "./NotificationsCard";
import { useApi } from "api";
import { Searchbar } from "components/Searchbar";
import Loading from "components/Loading";

export function Inbox() {
  const notifications = useApi.notificationsGetAll();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!notifications.data) {
      setCategories([]);
      return;
    }

    const uniqueCategories = Array.from(new Set(notifications.data.map((n) => n.category).filter(Boolean)));
    setCategories(uniqueCategories);
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
            <NotificationCard key={notification.timestamp} notification={notification} />
          ))}
        </>
      )}

      <SubTitle>History</SubTitle>
      {!seenNotifications || seenNotifications.length === 0 ? (
        <Card>No notifications</Card>
      ) : (
        seenNotifications.map((notification) => (
          <NotificationCard key={notification.timestamp} notification={notification} />
        ))
      )}
    </>
  );
}
