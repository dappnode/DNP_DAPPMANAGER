import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApi } from "api";
import ClipboardJS from "clipboard";
import QrCode from "components/QrCode";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Skeleton } from "components/primitives/skeleton";
import { Alert, AlertDescription } from "components/primitives/alert";
import { ArrowLeft, Copy, ExternalLink, QrCode as QrCodeIcon, TriangleAlert } from "lucide-react";
import { VpnDeviceCredentials } from "@dappnode/types";

export function OpenVpnDeviceDetails() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || "";
  const deviceCredentials = useApi.deviceCredentialsGet({ id });

  // Loading
  if (deviceCredentials.isValidating && !deviceCredentials.data) {
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
  if (deviceCredentials.error) {
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
            <p className="tw:text-sm tw:text-destructive">{deviceCredentials.error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!deviceCredentials.data) return null;

  return (
    <div className="tw:space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
        <ArrowLeft className="tw:size-3.5" />
        Back to devices
      </Button>
      <OpenVpnDeviceDetailsLoaded device={deviceCredentials.data} />
    </div>
  );
}

/* ── Loaded state ───────────────────────────────────────────────────── */

function OpenVpnDeviceDetailsLoaded({ device }: { device: VpnDeviceCredentials }) {
  const [showQr, setShowQr] = useState(false);
  const { id, url } = device;

  // Clipboard setup
  const clipboardRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      new ClipboardJS(".openvpn-copy-btn", { container: node });
    }
  }, []);

  return (
    <div ref={clipboardRef}>
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">{id || "Device not found"}</CardTitle>
          <CardDescription>OpenVPN credentials and connection details.</CardDescription>
        </CardHeader>
        <CardContent className="tw:space-y-4">
          {/* VPN credentials URL */}
          <div className="tw:space-y-2">
            <Label>VPN credentials URL</Label>
            <div className="tw:flex tw:gap-2">
              <Input readOnly value={url || ""} className="tw:flex-1 tw:font-mono tw:text-xs" />
              <Button
                variant="outline"
                size="icon"
                className="openvpn-copy-btn"
                data-clipboard-text={url}
                title="Copy URL"
              >
                <Copy className="tw:size-3.5" />
              </Button>
              <Button variant="outline" size="icon" asChild title="Open URL">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="tw:size-3.5" />
                </a>
              </Button>
            </div>
          </div>

          {/* QR code toggle */}
          <Button variant="outline" onClick={() => setShowQr(!showQr)}>
            <QrCodeIcon className="tw:size-3.5" />
            {showQr ? "Hide" : "Show"} QR code
          </Button>
          {showQr && url && (
            <div className="tw:flex tw:justify-center tw:py-2">
              <QrCode url={url} width="300px" />
            </div>
          )}

          {/* Admin credentials */}
          {device.admin && (
            <>
              {device.hasChangedPassword ? (
                <Alert>
                  <AlertDescription>
                    This admin user has already changed the password. Only the initial auto-generated password is
                    visible.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="tw:space-y-2">
                    <Label>Username</Label>
                    <div className="tw:flex tw:gap-2">
                      <Input readOnly value={device.id || ""} className="tw:flex-1 tw:font-mono tw:text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        className="openvpn-copy-btn"
                        data-clipboard-text={device.id}
                        title="Copy username"
                      >
                        <Copy className="tw:size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="tw:space-y-2">
                    <Label>Admin password</Label>
                    <div className="tw:flex tw:gap-2">
                      <Input readOnly value={device.password || ""} className="tw:flex-1 tw:font-mono tw:text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        className="openvpn-copy-btn"
                        data-clipboard-text={device.password}
                        title="Copy password"
                      >
                        <Copy className="tw:size-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Security warning */}
          <Alert variant="default" className="tw:border-yellow-500/30 tw:bg-yellow-50 tw:dark:bg-yellow-900/10">
            <TriangleAlert className="tw:size-4 tw:text-yellow-600" />
            <AlertDescription className="tw:text-sm">
              Beware of shoulder surfing attacks (unsolicited observers). This data grants admin access to your
              DAppNode.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
