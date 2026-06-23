import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Alert, AlertDescription, AlertTitle } from "components/primitives/alert";
import { CheckCircle, Loader2, ShieldAlert, ShieldOff, Smartphone, Monitor, ExternalLink } from "lucide-react";
import { docsUrl } from "params";

/* ── Props ──────────────────────────────────────────────────────────── */

interface CurrentDeviceCardProps {
  isPwa: boolean;
  isFullscreenOn: boolean;
  permission: NotificationPermission | null;
  permissionLoading: boolean;
  isSubInNotifier: boolean;
  isSubscribing: boolean;
  pwaSubtabUrl: string | undefined;
  device: string;
  requestPermission: () => void;
  subscribeBrowser: () => Promise<void>;
}

/* ── Component ─────────────────────────────────────────────────────── */

export function CurrentDeviceCard({
  isPwa,
  isFullscreenOn,
  permission,
  permissionLoading,
  isSubInNotifier,
  isSubscribing,
  pwaSubtabUrl,
  device,
  requestPermission,
  subscribeBrowser
}: CurrentDeviceCardProps) {
  const DeviceIcon = device === "Mobile" ? Smartphone : Monitor;

  return (
    <Card>
      <CardHeader>
        <div className="tw:flex tw:items-center tw:gap-2">
          <DeviceIcon className="tw:size-5 tw:text-muted-foreground" />
          <CardTitle>Current Device</CardTitle>
        </div>
        <CardDescription>Manage push notification subscription for this device.</CardDescription>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );

  function renderContent() {
    /* ── Fullscreen mode blocks management ──────────────────────────── */
    if (isFullscreenOn) {
      return (
        <Alert variant="warning">
          <ShieldAlert className="tw:size-4" />
          <AlertTitle>Exit full screen mode</AlertTitle>
          <AlertDescription>
            To manage your current device, please exit full screen mode. Some features may not work as expected.
          </AlertDescription>
        </Alert>
      );
    }

    /* ── Not in PWA → prompt to install app ─────────────────────────── */
    if (!isPwa || !permission) {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-4 tw:text-center">
          <Smartphone className="tw:size-10 tw:text-muted-foreground" />
          <div className="tw:space-y-1">
            <p className="tw:font-medium">Open the Dappnode App</p>
            <p className="tw:text-sm tw:text-muted-foreground">
              To check your device status, please open the Dappnode App.
              {!isPwa && " If you haven't installed the app yet, click the button below."}
            </p>
          </div>
          {pwaSubtabUrl && (
            <Button asChild>
              <a href={pwaSubtabUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="tw:size-4" />
                Install App
              </a>
            </Button>
          )}
        </div>
      );
    }

    /* ── Waiting for permission approval ────────────────────────────── */
    if (permissionLoading) {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-4">
          <Loader2 className="tw:size-6 tw:animate-spin tw:text-muted-foreground" />
          <p className="tw:text-sm tw:text-muted-foreground">Waiting for permissions approval…</p>
        </div>
      );
    }

    /* ── Permission denied ──────────────────────────────────────────── */
    if (permission === "denied") {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-4 tw:text-center">
          <ShieldOff className="tw:size-10 tw:text-destructive" />
          <div className="tw:space-y-1">
            <p className="tw:font-medium">Notifications permission denied</p>
            <p className="tw:text-sm tw:text-muted-foreground">
              Grant notification permission for this App in your browser settings to receive notifications.
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={docsUrl.pwaResetPermissions} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="tw:size-4" />
              Check Docs
            </a>
          </Button>
        </div>
      );
    }

    /* ── Permission not yet requested ───────────────────────────────── */
    if (permission === "default") {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-4 tw:text-center">
          <ShieldAlert className="tw:size-10 tw:text-caution" />
          <div className="tw:space-y-1">
            <p className="tw:font-medium">Grant notification permission</p>
            <p className="tw:text-sm tw:text-muted-foreground">
              To receive notifications on this device, grant the notification permission. Click the button below and
              then <strong>click "Allow"</strong> in the browser pop-up.
            </p>
          </div>
          <Button onClick={requestPermission}>Grant permission</Button>
        </div>
      );
    }

    /* ── Already subscribed ─────────────────────────────────────────── */
    if (isSubInNotifier) {
      return (
        <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
          <CheckCircle className="tw:size-5 tw:text-success tw:shrink-0" />
          <div className="tw:flex tw:flex-1 tw:items-center tw:justify-between tw:gap-2 tw:flex-wrap">
            <p className="tw:text-sm">Your device is subscribed to push notifications.</p>
            <Badge variant="success">Subscribed</Badge>
          </div>
        </div>
      );
    }

    /* ── Subscribing in progress ────────────────────────────────────── */
    if (isSubscribing) {
      return (
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:py-4">
          <Loader2 className="tw:size-6 tw:animate-spin tw:text-muted-foreground" />
          <p className="tw:text-sm tw:text-muted-foreground">Subscribing device…</p>
        </div>
      );
    }

    /* ── Not subscribed → offer to subscribe ────────────────────────── */
    return (
      <div className="tw:flex tw:flex-col tw:items-center tw:gap-4 tw:py-4 tw:text-center">
        <Smartphone className="tw:size-10 tw:text-muted-foreground" />
        <div className="tw:space-y-1">
          <p className="tw:font-medium">Device not subscribed</p>
          <p className="tw:text-sm tw:text-muted-foreground">Your device is not subscribed to push notifications.</p>
        </div>
        <Button onClick={subscribeBrowser}>Subscribe Device</Button>
      </div>
    );
  }
}
