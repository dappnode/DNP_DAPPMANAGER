import React from "react";
import { Card, CardContent } from "components/primitives/card";
import { Skeleton } from "components/primitives/skeleton";
import { TooltipProvider } from "components/primitives/tooltip";
import { TypographyH4 } from "components/primitives/typography";
import { Smartphone } from "lucide-react";
import { useHandleSubscription } from "hooks/PWA/useHandleSubscription";
import { usePwaInstall } from "pages/system/components/App/PwaInstallContext";
import { usePwaSubtabUrl } from "hooks/PWA/usePwaSubtabUrl";
import useDeviceInfo from "hooks/PWA/useDeviceInfo";
import { CurrentDeviceCard } from "./CurrentDeviceCard";
import { SubscriptionCard } from "./SubscriptionCard";

/* ── Component ─────────────────────────────────────────────────────── */

export function DevicesTab() {
  const {
    subscription: browserSub,
    subscriptionsList,
    isSubscribing,
    isSubInNotifier,
    deleteSubscription,
    requestPermission,
    permission,
    permissionLoading,
    subscribeBrowser,
    revalidateSubs
  } = useHandleSubscription();

  const { isPwa, isFullscreenOn } = usePwaInstall();
  const pwaSubtabUrl = usePwaSubtabUrl();
  const { device, loading: deviceLoading } = useDeviceInfo();

  /* ── Loading ─────────────────────────────────────────────────────── */

  if (deviceLoading) {
    return (
      <div className="tw:space-y-4">
        <Skeleton className="tw:h-32 tw:w-full tw:rounded-xl" />
        <Skeleton className="tw:h-16 tw:w-full tw:rounded-xl" />
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <TooltipProvider>
      <div className="tw:space-y-6">
        {/* Current device section */}
        <CurrentDeviceCard
          isPwa={isPwa}
          isFullscreenOn={isFullscreenOn}
          permission={permission}
          permissionLoading={permissionLoading}
          isSubInNotifier={isSubInNotifier}
          isSubscribing={isSubscribing}
          pwaSubtabUrl={pwaSubtabUrl}
          device={device}
          requestPermission={requestPermission}
          subscribeBrowser={subscribeBrowser}
        />

        {/* Subscribed devices list */}
        <div className="tw:space-y-3">
          <div className="tw:space-y-1">
            <TypographyH4>Subscribed Devices</TypographyH4>
            <p className="tw:text-sm tw:text-muted-foreground">
              All devices receiving push notifications from your Dappnode.
            </p>
          </div>

          {subscriptionsList && subscriptionsList.length > 0 ? (
            <div className="tw:space-y-2">
              {subscriptionsList.map((sub, index) => (
                <SubscriptionCard
                  key={sub.endpoint || index}
                  sub={sub}
                  isCurrentDevice={!!browserSub && browserSub.endpoint === sub.endpoint}
                  deleteSubscription={deleteSubscription}
                  revalidateSubs={revalidateSubs}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:py-8 tw:text-center">
                <Smartphone className="tw:size-8 tw:text-muted-foreground" />
                <p className="tw:text-sm tw:text-muted-foreground">
                  No subscribed devices yet. Subscribe your current device to start receiving notifications.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
