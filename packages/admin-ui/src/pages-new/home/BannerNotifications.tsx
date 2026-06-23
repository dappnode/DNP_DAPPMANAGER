import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { api, useApi } from "api";
import { Notification, Priority } from "@dappnode/types";
import { dappmanagerAliases, externalUrlProps } from "params";
import { resolveDappnodeUrl } from "utils/resolveDappnodeUrl";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { AlertDescription } from "components/primitives/alert";
import { Button } from "components/primitives/button";
import { Collapsible, CollapsibleContent } from "components/primitives/collapsible";
import { cn } from "lib/utils";

const NUM_BANNERS_SHOWN = 3;

/** Priority-based background + text color classes */
const priorityStyles: Record<Priority, string> = {
  [Priority.low]: "tw:bg-muted tw:text-muted-foreground",
  [Priority.medium]: "tw:bg-primary/10 tw:text-primary",
  [Priority.high]: "tw:bg-caution/15 tw:text-caution-foreground tw:dark:text-caution tw:dark:bg-caution/20",
  [Priority.critical]: "tw:bg-destructive/10 tw:text-destructive tw:dark:bg-destructive/20"
};

/** Map Priority → CTA button variant */
const priorityButtonVariant: Record<Priority, "default" | "outline" | "destructive"> = {
  [Priority.low]: "default",
  [Priority.medium]: "default",
  [Priority.high]: "outline",
  [Priority.critical]: "destructive"
};

/**
 * Filters notifications:
 * 1. Removes entries with errors
 * 2. Deduplicates by correlationId, keeping the most recent
 * 3. Keeps only triggered (not resolved) and unseen
 * 4. Sorts by priority (critical → low)
 */
function filterNotifications(notifications: Notification[]): Notification[] {
  const priorityOrder = [Priority.critical, Priority.high, Priority.medium, Priority.low];
  const map = new Map<string, Notification>();

  notifications
    .filter((n) => !n.errors)
    .forEach((n) => {
      const existing = map.get(n.correlationId);
      if (!existing || new Date(n.timestamp) > new Date(existing.timestamp)) {
        map.set(n.correlationId, n);
      }
    });

  return Array.from(map.values())
    .filter((n) => n.status === "triggered")
    .filter((n) => !n.seen)
    .sort((a, b) => priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority));
}

/* ── Main banner list ───────────────────────────────────────────────── */

export function BannerNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const oneMonthAgoTimestamp = useMemo(() => {
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return Math.floor(now.getTime() / 1000);
  }, []);

  const notificationsCall = useApi.notificationsGetBanner({ timestamp: oneMonthAgoTimestamp });

  useEffect(() => {
    if (notificationsCall.data) {
      setNotifications(filterNotifications(notificationsCall.data));
    }
  }, [notificationsCall.data]);

  // Revalidate every minute
  useEffect(() => {
    const interval = setInterval(() => notificationsCall.revalidate(), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!notifications.length) return null;

  return (
    <div className="tw:flex tw:flex-col tw:gap-card tw:px-page-x tw:pt-page-y">
      {notifications.slice(0, NUM_BANNERS_SHOWN).map((n) => (
        <BannerNotificationCard
          key={n.id}
          notification={n}
          onClose={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
        />
      ))}
    </div>
  );
}

/* ── Single banner card ─────────────────────────────────────────────── */

function BannerNotificationCard({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const defaultOpen = notification.priority === Priority.critical;
  const [open, setOpen] = useState(defaultOpen);

  const handleClose = () => {
    api.notificationSetSeenByCorrelationID({ correlationId: notification.correlationId });
    onClose();
  };

  const isExternalUrl =
    notification.callToAction && !dappmanagerAliases.some((alias) => notification.callToAction!.url.includes(alias));

  const buttonVariant = priorityButtonVariant[notification.priority];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "tw:relative tw:rounded-lg tw:border tw:px-3 tw:py-2.5 tw:pr-10 tw:text-sm tw:shadow-sm tw:cursor-pointer",
          priorityStyles[notification.priority]
        )}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Close button (top-right) */}
        <div className="tw:absolute tw:top-2 tw:right-2">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            aria-label="Dismiss notification"
          >
            <X />
          </Button>
        </div>

        {/* Title row */}
        <div className="tw:flex tw:items-center tw:gap-1.5 tw:font-medium">
          {notification.title}
          {open ? <ChevronUp className="tw:size-3.5" /> : <ChevronDown className="tw:size-3.5" />}
        </div>

        {/* Collapsible body */}
        <CollapsibleContent>
          <AlertDescription className="tw:mt-1.5">
            <ReactMarkdown
              children={notification.body}
              components={{ a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} /> }}
            />

            {notification.callToAction && (
              <NavLink
                to={resolveDappnodeUrl(notification.callToAction.url, window.location)}
                {...(isExternalUrl ? externalUrlProps : {})}
                className="tw:inline-block tw:mt-2"
              >
                <Button variant={buttonVariant} size="sm">
                  {notification.callToAction.title}
                </Button>
              </NavLink>
            )}
          </AlertDescription>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
