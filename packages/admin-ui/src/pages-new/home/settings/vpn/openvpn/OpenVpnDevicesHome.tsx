import React, { useState } from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { vpnDnpName, MAIN_ADMIN_NAME, docsUrl } from "params";
import { prettyDnpName } from "utils/format";
import { coerceDeviceName, MAX_ID_LENGTH } from "../helpers";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Badge } from "components/primitives/badge";
import { Switch } from "components/primitives/switch";
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
import { ArrowLeft, Plus, Trash2, RotateCw, Info } from "lucide-react";
import { VpnDevice } from "@dappnode/types";

export function OpenVpnDevicesHome() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const devicesReq = useApi.devicesList();
  const dnpRequest = useApi.packageGet({ dnpName: vpnDnpName });
  const dnp = dnpRequest.data;

  /* ── Actions ────────────────────────────────────────────────────── */

  async function addDevice(id: string) {
    if (!id) return;
    try {
      toast.loading(`Adding ${id}...`);
      await api.deviceAdd({ id });
      toast.success(`Added ${id}`);
      setInput("");
      devicesReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function removeDevice(id: string) {
    try {
      toast.loading(`Removing ${id}...`);
      await api.deviceRemove({ id });
      toast.success(`Removed ${id}`);
      devicesReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function resetDevice(id: string) {
    try {
      toast.loading(`Resetting ${id}...`);
      await api.deviceReset({ id });
      toast.success(`Reset ${id}`);
      devicesReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function toggleAdmin(id: string, isAdmin: boolean) {
    try {
      toast.loading(`${isAdmin ? "Granting" : "Revoking"} admin for ${id}...`);
      await api.deviceAdminToggle({ id, isAdmin });
      toast.success(`${isAdmin ? "Granted" : "Revoked"} admin for ${id}`);
      devicesReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  /* ── Validation ─────────────────────────────────────────────────── */

  const inputError = input.length > MAX_ID_LENGTH ? `Name must be shorter than ${MAX_ID_LENGTH} characters` : "";

  /* ── Not installed ──────────────────────────────────────────────── */

  if (dnpRequest.isValidating && !dnp) {
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to VPN
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">OpenVPN</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="tw:h-32 tw:w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dnp) {
    const notFound = dnpRequest.error?.message?.includes("No DNP was found");
    return (
      <div className="tw:space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
          <ArrowLeft className="tw:size-3.5" />
          Back to VPN
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="tw:text-base">OpenVPN</CardTitle>
          </CardHeader>
          <CardContent>
            {notFound ? (
              <Alert>
                <Info className="tw:size-4" />
                <AlertDescription>
                  {prettyDnpName(vpnDnpName)} is not installed. Install it from the Packages section.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="tw:text-sm tw:text-destructive">
                {dnpRequest.error?.message || "Error loading OpenVPN package"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Devices list ───────────────────────────────────────────────── */

  const devices: VpnDevice[] = devicesReq.data
    ? [...devicesReq.data].sort((d1) => (d1.id === MAIN_ADMIN_NAME ? -1 : 0))
    : [];

  return (
    <div className="tw:space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("..")}>
        <ArrowLeft className="tw:size-3.5" />
        Back to VPN
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">OpenVPN Devices</CardTitle>
          <CardDescription>
            Manage OpenVPN credentials for each device.{" "}
            <a
              href={docsUrl.openVpn}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:underline tw:text-primary"
            >
              Setup guide
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="tw:space-y-4">
          {/* Add device */}
          <div className="tw:flex tw:gap-2">
            <Input
              placeholder="Device's unique name"
              value={input}
              onChange={(e) => setInput(coerceDeviceName(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && input && !inputError) {
                  addDevice(input);
                }
              }}
              className="tw:flex-1"
            />
            <Button onClick={() => addDevice(input)} disabled={!input || !!inputError}>
              <Plus className="tw:size-3.5" />
              Add device
            </Button>
          </div>
          {inputError && <p className="tw:text-xs tw:text-destructive">{inputError}</p>}

          {/* Devices list */}
          {devicesReq.isValidating && !devicesReq.data ? (
            <Skeleton className="tw:h-24 tw:w-full" />
          ) : devicesReq.error ? (
            <p className="tw:text-sm tw:text-destructive">{devicesReq.error.message}</p>
          ) : devices.length === 0 ? (
            <p className="tw:text-sm tw:text-muted-foreground">No devices found.</p>
          ) : (
            <div className="tw:space-y-2">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="tw:flex tw:items-center tw:justify-between tw:rounded-lg tw:border tw:p-3"
                >
                  <div className="tw:flex tw:items-center tw:gap-2 tw:min-w-0">
                    <span className="tw:text-sm tw:font-medium tw:truncate">{device.id}</span>
                    {device.admin && <Badge variant="secondary">Admin</Badge>}
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-1">
                    {/* Get credentials */}
                    <Button variant="outline" size="sm" onClick={() => navigate(device.id)}>
                      Get
                    </Button>

                    {/* Admin toggle */}
                    <Switch checked={device.admin} onCheckedChange={() => toggleAdmin(device.id, !device.admin)} />

                    {/* Reset */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="tw:size-8">
                          <RotateCw className="tw:size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {device.id === MAIN_ADMIN_NAME
                              ? "WARNING! Resetting main admin"
                              : `Reset ${device.id} device`}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {device.id === MAIN_ADMIN_NAME
                              ? "Only reset the main admin credentials if you suspect unauthorized access. Download and install the new credentials IMMEDIATELY or you will lose access."
                              : "All profiles and links pointing to this device will no longer be valid."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => resetDevice(device.id)}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Remove */}
                    {device.admin ? (
                      <Button variant="ghost" size="icon" disabled className="tw:size-8">
                        <Trash2 className="tw:size-3.5 tw:text-muted-foreground" />
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="tw:size-8">
                            <Trash2 className="tw:size-3.5 tw:text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {device.id}</AlertDialogTitle>
                            <AlertDialogDescription>
                              The user using this device will lose access to this DAppNode.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeDevice(device.id)}>Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
