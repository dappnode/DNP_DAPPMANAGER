import React, { useState } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { adminUiLocalDomain, docsUrl, httpsPortalDnpName } from "params";
import { getInstallerPath } from "pages/installer";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Switch } from "components/primitives/switch";
import { Badge } from "components/primitives/badge";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertDescription } from "components/primitives/alert";
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
import { Globe, Info, TriangleAlert } from "lucide-react";

export function LocalNetworkProxySection() {
  const navigate = useNavigate();
  const localProxyingStatus = useApi.localProxyingStatusGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  const [toggling, setToggling] = useState(false);

  // Loading state
  if (localProxyingStatus.isValidating && !localProxyingStatus.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Local Network Proxy</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="tw:h-16 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (localProxyingStatus.error && !localProxyingStatus.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Local Network Proxy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="tw:text-sm tw:text-destructive">
            {localProxyingStatus.error.message || "Error loading Local Network Proxy status"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // HTTPS Portal not installed
  if (localProxyingStatus.data === "https missing") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Local Network Proxy</CardTitle>
          <CardDescription>Access your Dappnode UI from devices on the same local network.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="tw:size-4" />
            <AlertDescription>
              You must{" "}
              <Button
                variant="link"
                className="tw:h-auto tw:p-0"
                onClick={() => navigate(`${getInstallerPath(httpsPortalDnpName)}/${httpsPortalDnpName}`)}
              >
                install the HTTPS Portal
              </Button>{" "}
              to use this feature.{" "}
              <a
                href={docsUrl.connectLocalProxy}
                target="_blank"
                rel="noopener noreferrer"
                className="tw:underline tw:text-primary"
              >
                Learn more
              </a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!localProxyingStatus.data) return null;

  const isRunning = localProxyingStatus.data === "running";
  const isCrashed = localProxyingStatus.data === "crashed";

  async function toggleProxy() {
    try {
      setToggling(true);
      toast.loading(isRunning ? "Stopping Local Network Proxy..." : "Starting Local Network Proxy...");
      await api.localProxyingEnableDisable(!isRunning);
      toast.success(isRunning ? "Stopped Local Network Proxy" : "Started Local Network Proxy");
      localProxyingStatus.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setToggling(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Local Network Proxy</CardTitle>
        <CardDescription>
          Access your Dappnode UI from devices on the same local network.{" "}
          <a
            href={docsUrl.connectLocalProxy}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:underline tw:text-primary"
          >
            Learn more
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {/* Reliability warning */}
        <Alert variant="default" className="tw:border-yellow-500/30 tw:bg-yellow-50 tw:dark:bg-yellow-900/10">
          <TriangleAlert className="tw:size-4 tw:text-yellow-600" />
          <AlertDescription className="tw:text-sm">
            Connecting via local proxy is less reliable than using a VPN or Wi-Fi hotspot and should be used{" "}
            <strong>only as a fallback</strong>. It only provides access to the Dappmanager UI, not other package
            interfaces.
          </AlertDescription>
        </Alert>

        {/* Local domain link */}
        <p className="tw:text-sm tw:text-muted-foreground">
          If you are on the same network as your Dappnode, access the UI at{" "}
          <a href={adminUiLocalDomain} className="tw:text-primary tw:underline">
            {adminUiLocalDomain}
          </a>
          .
        </p>

        {/* Same-IP notice */}
        {dappnodeIdentity.internalIp === dappnodeIdentity.ip && (
          <p className="tw:text-sm tw:text-muted-foreground">
            Local and public IPs are equal. Your Dappnode may be running on a remote machine and does not require Local
            Network Proxy.
          </p>
        )}

        {/* Status + toggle */}
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-2">
            <Globe className="tw:size-4 tw:text-muted-foreground" />
            <span className="tw:text-sm tw:font-medium">Local Network Proxy</span>
            <Badge variant={isRunning ? "success" : isCrashed ? "destructive" : "secondary"}>
              {isRunning ? "Running" : isCrashed ? "Crashed" : "Stopped"}
            </Badge>
          </div>
          {isRunning ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Switch checked={true} disabled={toggling} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Stop Local Network Proxy</AlertDialogTitle>
                  <AlertDialogDescription>
                    If you are connected through the Local Network Proxy you may lose access to your Dappnode. Make sure
                    you have an alternative connection method (Wi-Fi or VPN).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleProxy}>Stop</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Switch checked={false} onCheckedChange={toggleProxy} disabled={toggling} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
