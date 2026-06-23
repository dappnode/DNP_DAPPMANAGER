import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { Notification, Priority } from "@dappnode/types";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "components/primitives/card";
import { Badge } from "components/primitives/badge";
import { Button } from "components/primitives/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "components/primitives/collapsible";
import { prettyDnpName } from "utils/format";
import { api } from "api";
import { dappmanagerAliases, externalUrlProps } from "params";
import { resolveDappnodeUrl } from "utils/resolveDappnodeUrl";
import RenderMarkdown from "components/RenderMarkdown";
import dappnodeLogo from "img/dappnode-logo-only.png";

/* ── Priority styling map ──────────────────────────────────────────── */

const priorityConfig: Record<
  Priority,
  { label: string; variant: "default" | "secondary" | "destructive" | "caution" | "outline" }
> = {
  [Priority.low]: { label: "Informational", variant: "secondary" },
  [Priority.medium]: { label: "Relevant", variant: "outline" },
  [Priority.high]: { label: "Important", variant: "caution" },
  [Priority.critical]: { label: "Critical", variant: "destructive" }
};

/* ── Helpers ───────────────────────────────────────────────────────── */

function prettifiedBody(body: string): string {
  if (body.includes("resolved: ")) return body.replace("resolved:", "Resolved:");
  if (body.includes("triggered: ")) return body.replace("triggered:", "Attention:");
  return body;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/* ── Component ─────────────────────────────────────────────────────── */

interface NotificationCardProps {
  notification: Notification;
  openByDefault?: boolean;
}

export function NotificationCard({ notification, openByDefault = false }: NotificationCardProps) {
  const [open, setOpen] = useState(openByDefault);

  const avatar = notification.icon || dappnodeLogo;
  const priority = priorityConfig[notification.priority];
  const category = notification.category.charAt(0).toUpperCase() + notification.category.slice(1);

  const isExternalUrl =
    notification.callToAction && !dappmanagerAliases.some((alias) => notification.callToAction!.url.includes(alias));

  // Auto-mark resolved banner notifications as seen
  useEffect(() => {
    if (!notification.seen && notification.isBanner && notification.status === "resolved") {
      api.notificationSetSeenByCorrelationID({ correlationId: notification.correlationId });
    }
  }, []); // Run once on mount

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card size="sm" className={!notification.seen ? "tw:border-primary/40" : ""}>
        <CollapsibleTrigger asChild>
          <CardContent className="tw:py-0 tw:cursor-pointer tw:select-none">
            {/* Desktop: single row | Mobile: stacked */}
            <div className="tw:flex tw:flex-col tw:gap-2 tw:sm:flex-row tw:sm:items-center tw:sm:gap-3">
              {/* Left group: avatar + text */}
              <div className="tw:flex tw:items-center tw:gap-3 tw:min-w-0 tw:flex-1">
                {/* Avatar */}
                <img
                  src={avatar}
                  alt={notification.dnpName}
                  className="tw:size-8 tw:rounded-md tw:object-contain tw:shrink-0"
                />

                {/* Text block */}
                <div className="tw:min-w-0 tw:flex-1">
                  {/* Title + badges */}
                  <div className="tw:flex tw:items-center tw:gap-2 tw:flex-wrap">
                    <p className="tw:font-medium tw:truncate tw:text-sm">{notification.title}</p>
                    <Badge variant={priority.variant} className="tw:shrink-0">
                      {priority.label}
                    </Badge>
                    {notification.status === "resolved" && (
                      <Badge variant="success" className="tw:shrink-0">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  {/* Meta: package · category · timestamp */}
                  <div className="tw:flex tw:items-center tw:gap-1.5 tw:text-xs tw:text-muted-foreground tw:flex-wrap">
                    <span className="tw:truncate tw:max-w-32 tw:sm:max-w-none">
                      {prettyDnpName(notification.dnpName)}
                    </span>
                    <span>·</span>
                    <span>{category}</span>
                    <span>·</span>
                    <span className="tw:whitespace-nowrap">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Right group: CTA + chevron */}
              <div className="tw:flex tw:items-center tw:gap-2 tw:shrink-0 tw:pl-11 tw:sm:pl-0">
                {notification.callToAction && (
                  <NavLink
                    to={resolveDappnodeUrl(notification.callToAction.url, window.location)}
                    {...(isExternalUrl ? externalUrlProps : {})}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" size="sm">
                      {notification.callToAction.title}
                    </Button>
                  </NavLink>
                )}
                <ChevronDown
                  className={`tw:size-4 tw:text-muted-foreground tw:transition-transform tw:duration-200 ${
                    open ? "tw:rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="tw:pt-0 tw:pb-1 tw:pl-14">
            <div className="tw:text-xs tw:text-muted-foreground tw:leading-relaxed">
              <RenderMarkdown source={prettifiedBody(notification.body)} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
