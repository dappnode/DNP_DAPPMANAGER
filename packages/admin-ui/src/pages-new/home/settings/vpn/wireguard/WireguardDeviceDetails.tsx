import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi, apiRoutes } from "api";
import ClipboardJS from "clipboard";
import QrCode from "components/QrCode";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Label } from "components/primitives/label";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertDescription } from "components/primitives/alert";
import { ArrowLeft, Copy, Download, QrCode as QrCodeIcon, TriangleAlert } from "lucide-react";
import { WireguardDeviceCredentials } from "@dappnode/types";

export function WireguardDeviceDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || "";
  const device = useApi.wireguardDeviceGet(id);

  // Loading
  if (device.isValidating && !device.data) {
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">{id}</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="tw:h-32 tw:w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error
  if (device.error) {
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">{id}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="tw:text-sm tw:text-destructive">{device.error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!device.data) return null;

  return (
    <div className="tw:space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
        <ArrowLeft className="tw:size-3.5" />
        Back to devices
      </Button>
      <WireguardDeviceDetailsLoaded id={id} device={device.data} />
    </div>
  );
}

/* ── Loaded state ───────────────────────────────────────────────────── */

function WireguardDeviceDetailsLoaded({ id, device }: { id: string; device: WireguardDeviceCredentials }) {
  const [showQr, setShowQr] = useState(false);
  const [showLocal, setShowLocal] = useState(false);

  const config = showLocal ? device.configLocal : device.configRemote;
  const configLabel = showLocal ? "local" : "remote";

  // Clipboard setup
  const clipboardRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      new ClipboardJS(".wireguard-copy-btn", { container: node });
    }
  }, []);

  return (
    <div ref={clipboardRef}>
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">{id || "Device not found"}</CardTitle>
          <CardDescription>
            Add the following VPN configuration in your Wireguard client. If you experience issues connecting from the
            same network as your Dappnode, use the local credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="tw:space-y-4">
          {/* Remote / Local toggle */}
          <div className="tw:flex tw:items-center tw:gap-2">
            <Button variant={showLocal ? "outline" : "default"} size="sm" onClick={() => setShowLocal(false)}>
              Remote
            </Button>
            <Button variant={showLocal ? "default" : "outline"} size="sm" onClick={() => setShowLocal(true)}>
              Local
            </Button>
          </div>

          {/* Action buttons */}
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            <Button variant="outline" asChild>
              <a href={apiRoutes.downloadWireguardConfig({ device: id, isLocal: showLocal })}>
                <Download className="tw:size-3.5" />
                Download {configLabel} config
              </a>
            </Button>

            <Button variant="outline" className="wireguard-copy-btn" data-clipboard-text={config}>
              <Copy className="tw:size-3.5" />
              Copy {configLabel} config
            </Button>

            <Button variant="outline" onClick={() => setShowQr(!showQr)}>
              <QrCodeIcon className="tw:size-3.5" />
              {showQr ? "Hide" : "Show"} QR code
            </Button>
          </div>

          {/* Config display */}
          <div className="tw:space-y-2">
            <Label>VPN {configLabel} credentials</Label>
            <div className="tw:rounded-md tw:bg-muted tw:p-3 tw:max-h-64 tw:overflow-y-auto">
              <pre className="tw:text-xs tw:whitespace-pre-wrap tw:font-mono">{config}</pre>
            </div>
          </div>

          {/* QR code */}
          {showQr && config && (
            <div className="tw:flex tw:justify-center tw:py-2">
              <QrCode url={config} width="300px" />
            </div>
          )}

          {/* Security warning */}
          <Alert variant="default" className="tw:border-yellow-500/30 tw:bg-yellow-50 tw:dark:bg-yellow-900/10">
            <TriangleAlert className="tw:size-4 tw:text-yellow-600" />
            <AlertDescription className="tw:text-sm">
              Beware of shoulder surfing attacks (unsolicited observers). This data grants access to your DAppNode.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
