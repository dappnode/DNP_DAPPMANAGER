import React, { useEffect } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { wifiDnpName } from "params";
import { prettyDnpName } from "utils/format";
import { continueIfCalleDisconnected } from "api/utils";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Switch } from "components/primitives/switch";
import { Badge } from "components/primitives/badge";
import { Skeleton } from "components/primitives/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "components/primitives/alert-dialog";
import { Wifi, WifiOff } from "lucide-react";

export function WifiStatusSection() {
  const wifiDnp = useApi.packageGet({ dnpName: wifiDnpName });
  const wifiReport = useApi.wifiReportGet();

  useEffect(() => {
    const interval = setInterval(() => {
      wifiReport.revalidate();
    }, 5000);
    return () => clearInterval(interval);
  }, [wifiReport]);

  if (wifiDnp.isValidating && !wifiDnp.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Wi-Fi Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="tw:h-16 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!wifiDnp.data) {
    const notInstalled = wifiDnp.error?.message?.includes("No DNP was found");
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Wi-Fi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tw:text-sm tw:text-muted-foreground">
            {notInstalled
              ? `The Wi-Fi package (${prettyDnpName(wifiDnpName)}) is not installed.`
              : `Error loading Wi-Fi package: ${wifiDnp.error?.message || "Unknown error"}`}
          </p>
        </CardContent>
      </Card>
    );
  }

  const container = wifiDnp.data.containers[0];
  const isRunning = container?.state === "running";

  async function toggleWifi() {
    try {
      toast.loading(isRunning ? "Pausing Wi-Fi..." : "Starting Wi-Fi...");
      await continueIfCalleDisconnected(() => api.packageStartStop({ dnpName: wifiDnpName }), wifiDnpName)();
      toast.success(isRunning ? "Wi-Fi paused" : "Wi-Fi started");
      wifiDnp.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Wi-Fi Status</CardTitle>
        <CardDescription>Manage the Wi-Fi hotspot exposed by your Dappnode.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-2">
            {isRunning ? (
              <Wifi className="tw:size-4 tw:text-green-500" />
            ) : (
              <WifiOff className="tw:size-4 tw:text-muted-foreground" />
            )}
            <span className="tw:text-sm tw:font-medium">Wi-Fi Service</span>
            <Badge variant={isRunning ? "success" : "secondary"}>{isRunning ? "Running" : "Stopped"}</Badge>
          </div>
          {isRunning ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Switch checked={true} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pause Wi-Fi service</AlertDialogTitle>
                  <AlertDialogDescription>
                    If you are connected through Wi-Fi, you may lose access to your Dappnode. Make sure you have an
                    alternative connection method.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleWifi}>Pause</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Switch checked={false} onCheckedChange={toggleWifi} />
          )}
        </div>

        {wifiReport.data?.info && <p className="tw:text-sm tw:text-muted-foreground">{wifiReport.data.info}</p>}
        {wifiReport.data?.report && (
          <div className="tw:rounded-md tw:bg-muted tw:p-2 tw:text-xs tw:font-mono">
            {wifiReport.data.report.lastLog}
            {wifiReport.data.report.exitCode !== undefined && `. Exit code: ${wifiReport.data.report.exitCode}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
