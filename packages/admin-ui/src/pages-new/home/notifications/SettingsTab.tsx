import React, { useEffect, useState } from "react";
import { useApi } from "api";
import { GatusEndpoint, CustomEndpoint } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Switch } from "components/primitives/switch";
import { Skeleton } from "components/primitives/skeleton";
import { Separator } from "components/primitives/separator";
import { TypographyH4 } from "components/primitives/typography";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "components/primitives/alert-dialog";
import { useHandleNotificationsPkg } from "hooks/useHandleNotificationsPkg";
import { PackageEndpoints } from "./PackageEndpoints";

/* ── Types ──────────────────────────────────────────────────────────── */

interface EndpointsData {
  [dnpName: string]: {
    endpoints: GatusEndpoint[];
    customEndpoints: CustomEndpoint[];
    isCore: boolean;
  };
}

/* ── Component ─────────────────────────────────────────────────────── */

export function SettingsTab() {
  const [endpointsData, setEndpointsData] = useState<EndpointsData | undefined>();
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const endpointsCall = useApi.notificationsGetAllEndpoints();
  const { isLoading: pkgLoading, isRunning, startStopNotificationsNoConfirm } = useHandleNotificationsPkg();

  useEffect(() => {
    if (endpointsCall.data) {
      setEndpointsData(endpointsCall.data as EndpointsData);
    }
  }, [endpointsCall.data]);

  /* ── Loading ─────────────────────────────────────────────────────── */

  if (pkgLoading || endpointsCall.isValidating) {
    return (
      <div className="tw:space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="tw:h-16 tw:w-full tw:rounded-xl" />
        ))}
      </div>
    );
  }

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <div className="tw:space-y-6">
      {/* Enable / Disable notifications */}
      <Card>
        <CardHeader className="tw:flex tw:flex-row tw:items-center tw:justify-between tw:gap-4">
          <div>
            <CardTitle>Enable notifications</CardTitle>
            <CardDescription>
              Enable the notifications service to receive alerts about your Dappnode system.
            </CardDescription>
          </div>

          {/* When running → show confirmation dialog before pausing */}
          {isRunning ? (
            <AlertDialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
              <Switch checked={isRunning} onCheckedChange={() => setPauseDialogOpen(true)} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pause notifications package</AlertDialogTitle>
                  <AlertDialogDescription>
                    The notifications package may alert you to critical issues. Pausing it could result in missing
                    important notifications.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={startStopNotificationsNoConfirm}>Pause</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Switch checked={isRunning} onCheckedChange={startStopNotificationsNoConfirm} />
          )}
        </CardHeader>
      </Card>

      {/* Package endpoint management */}
      {isRunning && !pkgLoading && endpointsData && (
        <>
          <Separator />

          <div className="tw:space-y-2">
            <TypographyH4>Manage notifications</TypographyH4>
            <p className="tw:text-muted-foreground">
              Enable, disable, and customize notifications for each installed package.
            </p>
          </div>

          <div className="tw:space-y-4">
            {Object.entries(endpointsData).map(([dnpName, data]) => (
              <PackageEndpoints
                key={dnpName}
                dnpName={dnpName}
                gatusEndpoints={data.endpoints}
                customEndpoints={data.customEndpoints}
                isCore={data.isCore}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
