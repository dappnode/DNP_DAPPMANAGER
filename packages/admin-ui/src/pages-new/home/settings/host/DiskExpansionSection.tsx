import React, { useState } from "react";
import { api } from "api";
import { HostHardDisk, HostVolumeGroup, HostLogicalVolume } from "@dappnode/types";
import { dappnodeVolumeGroup, dappnodeLogicalVolume, forumUrl } from "params";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Alert, AlertDescription } from "components/primitives/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/primitives/select";
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
import { HardDrive, ExternalLink, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

type ReqStatus<T> = { loading?: boolean; result?: T; error?: unknown };

export function DiskExpansionSection() {
  const [mode, setMode] = useState<"idle" | "automatic" | "manual">("idle");

  // Request states
  const [diskReq, setDiskReq] = useState<ReqStatus<HostHardDisk[]>>({});
  const [volumeGroupReq, setVolumeGroupReq] = useState<ReqStatus<HostVolumeGroup[]>>({});
  const [logicalVolumeReq, setLogicalVolumeReq] = useState<ReqStatus<HostLogicalVolume[]>>({});
  const [expandReq, setExpandReq] = useState<ReqStatus<string>>({});

  // Selected values
  const [disk, setDisk] = useState("");
  const [volumeGroup, setVolumeGroup] = useState("");
  const [logicalVolume, setLogicalVolume] = useState("");

  /* ── API calls ──────────────────────────────────────────────────── */

  async function getDisks() {
    try {
      setDiskReq({ loading: true });
      const disks = await api.lvmhardDisksGet();
      if (disks[0]) setDisk(disks[0].name);
      setDiskReq({ result: disks });
    } catch (e) {
      setDiskReq({ error: e });
    }
  }

  async function getVolumeGroups() {
    try {
      setVolumeGroupReq({ loading: true });
      const vgs = await api.lvmVolumeGroupsGet();
      if (vgs[0]) setVolumeGroup(vgs[0].vg_name);
      setVolumeGroupReq({ result: vgs });
    } catch (e) {
      setVolumeGroupReq({ error: e });
    }
  }

  async function getLogicalVolumes() {
    try {
      setLogicalVolumeReq({ loading: true });
      const lvs = await api.lvmLogicalVolumesGet();
      if (lvs[0]) setLogicalVolume(lvs[0].lv_name);
      setLogicalVolumeReq({ result: lvs });
    } catch (e) {
      setLogicalVolumeReq({ error: e });
    }
  }

  async function getDappnodeDefaults() {
    try {
      const vgs = await api.lvmVolumeGroupsGet();
      const defaultVg = vgs.find((vg) => vg.vg_name === dappnodeVolumeGroup)?.vg_name;
      if (!defaultVg) throw Error(`Default volume group "${dappnodeVolumeGroup}" not found`);
      setVolumeGroup(defaultVg);

      const lvs = await api.lvmLogicalVolumesGet();
      const defaultLv = lvs.find((lv) => lv.lv_name === dappnodeLogicalVolume)?.lv_name;
      if (!defaultLv) throw Error(`Default logical volume "${dappnodeLogicalVolume}" not found`);
      setLogicalVolume(defaultLv);
    } catch (e) {
      setExpandReq({ error: e });
    }
  }

  async function expandDisk() {
    try {
      setExpandReq({ loading: true });
      const result = await api.lvmDiskSpaceExtend({ disk, volumeGroup, logicalVolume });
      setExpandReq({ result });
    } catch (e) {
      setExpandReq({ error: e });
    }
  }

  function cleanAndSetMode(newMode: "automatic" | "manual") {
    setDisk("");
    setVolumeGroup("");
    setLogicalVolume("");
    setDiskReq({});
    setVolumeGroupReq({});
    setLogicalVolumeReq({});
    setExpandReq({});
    setMode(newMode);
  }

  /* ── Helpers ────────────────────────────────────────────────────── */

  const expandError = expandReq.error
    ? expandReq.error instanceof Error
      ? expandReq.error.message
      : String(expandReq.error)
    : null;

  const diskError = diskReq.error
    ? diskReq.error instanceof Error
      ? diskReq.error.message
      : String(diskReq.error)
    : null;

  const vgError = volumeGroupReq.error
    ? volumeGroupReq.error instanceof Error
      ? volumeGroupReq.error.message
      : String(volumeGroupReq.error)
    : null;

  const lvError = logicalVolumeReq.error
    ? logicalVolumeReq.error instanceof Error
      ? logicalVolumeReq.error.message
      : String(logicalVolumeReq.error)
    : null;

  const canExpand = disk && volumeGroup && logicalVolume;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Disk Expansion (LVM)</CardTitle>
        <CardDescription>
          Expand your Dappnode filesystem with another storage device.{" "}
          <a
            href={forumUrl.expandFileSystemHowTo}
            target="_blank"
            rel="noopener noreferrer"
            className="tw:underline tw:text-primary"
          >
            <ExternalLink className="tw:inline tw:size-3 tw:mr-0.5" />
            How-to guide
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        {/* Mode selection */}
        {mode === "idle" && (
          <div className="tw:flex tw:gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>
                  <HardDrive className="tw:size-3.5" />
                  Automatic expansion
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Extend the host filesystem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Extending the filesystem is a dangerous operation that cannot be undone. You must read the DAppNode
                    documentation about extending the filesystem with LVM. Contact support if you have any doubt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cleanAndSetMode("automatic")}>
                    I understand, proceed
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Manual expansion</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Extend the host filesystem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Extending the filesystem is a dangerous operation that cannot be undone. You must read the DAppNode
                    documentation about extending the filesystem with LVM. Contact support if you have any doubt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cleanAndSetMode("manual")}>I understand, proceed</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {/* Step 1: Select storage device (both modes) */}
        {mode !== "idle" && (
          <div className="tw:space-y-3">
            <div className="tw:flex tw:items-center tw:justify-between">
              <p className="tw:text-sm tw:font-medium">
                Mode: <Badge variant="secondary">{mode}</Badge>
              </p>
              <Button variant="ghost" size="sm" onClick={() => setMode("idle")}>
                Cancel
              </Button>
            </div>

            <div className="tw:space-y-2">
              <p className="tw:text-sm tw:font-medium">1. Select storage device</p>
              <Button variant="outline" size="sm" onClick={getDisks}>
                {diskReq.loading ? <Loader2 className="tw:size-3.5 tw:animate-spin" /> : "Get storage devices"}
              </Button>
              {diskReq.result && diskReq.result.length > 0 && (
                <Select value={disk} onValueChange={setDisk}>
                  <SelectTrigger className="tw:w-64">
                    <SelectValue placeholder="Select a disk" />
                  </SelectTrigger>
                  <SelectContent>
                    {diskReq.result.map((d) => (
                      <SelectItem key={d.name} value={d.name}>
                        {d.name} ({d.size})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {diskError && <p className="tw:text-xs tw:text-destructive">{diskError}</p>}
            </div>
          </div>
        )}

        {/* Automatic mode: get defaults */}
        {mode === "automatic" && disk && (
          <div className="tw:space-y-2">
            <p className="tw:text-sm tw:font-medium">2. Get DAppNode default values</p>
            <Button variant="outline" size="sm" onClick={getDappnodeDefaults} disabled={!disk}>
              Get default values
            </Button>
          </div>
        )}

        {/* Manual mode: select VG */}
        {mode === "manual" && disk && (
          <div className="tw:space-y-2">
            <p className="tw:text-sm tw:font-medium">2. Select Volume Group</p>
            <Button variant="outline" size="sm" onClick={getVolumeGroups} disabled={!disk}>
              {volumeGroupReq.loading ? <Loader2 className="tw:size-3.5 tw:animate-spin" /> : "Get volume groups"}
            </Button>
            {volumeGroupReq.result && volumeGroupReq.result.length > 0 && (
              <Select value={volumeGroup} onValueChange={setVolumeGroup}>
                <SelectTrigger className="tw:w-64">
                  <SelectValue placeholder="Select a volume group" />
                </SelectTrigger>
                <SelectContent>
                  {volumeGroupReq.result.map((vg) => (
                    <SelectItem key={vg.vg_name} value={vg.vg_name}>
                      {vg.vg_name} ({vg.vg_size})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {vgError && <p className="tw:text-xs tw:text-destructive">{vgError}</p>}
          </div>
        )}

        {/* Manual mode: select LV */}
        {mode === "manual" && volumeGroup && (
          <div className="tw:space-y-2">
            <p className="tw:text-sm tw:font-medium">3. Select Logical Volume</p>
            <Button variant="outline" size="sm" onClick={getLogicalVolumes} disabled={!disk || !volumeGroup}>
              {logicalVolumeReq.loading ? <Loader2 className="tw:size-3.5 tw:animate-spin" /> : "Get logical volumes"}
            </Button>
            {logicalVolumeReq.result && logicalVolumeReq.result.length > 0 && (
              <Select value={logicalVolume} onValueChange={setLogicalVolume}>
                <SelectTrigger className="tw:w-64">
                  <SelectValue placeholder="Select a logical volume" />
                </SelectTrigger>
                <SelectContent>
                  {logicalVolumeReq.result.map((lv) => (
                    <SelectItem key={lv.lv_name} value={lv.lv_name}>
                      {lv.lv_name} ({lv.lv_size}) — {lv.vg_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {lvError && <p className="tw:text-xs tw:text-destructive">{lvError}</p>}
          </div>
        )}

        {/* Final step: expand */}
        {mode !== "idle" && canExpand && (
          <div className="tw:space-y-3">
            <p className="tw:text-sm tw:font-medium">{mode === "automatic" ? "3" : "4"}. Expand disk space</p>
            <div className="tw:rounded-md tw:bg-muted tw:p-3 tw:text-sm tw:space-y-1">
              <p>
                <strong>Storage device:</strong> {disk}
              </p>
              <p>
                <strong>Volume Group:</strong> {volumeGroup}
              </p>
              <p>
                <strong>Logical Volume:</strong> {logicalVolume}
              </p>
            </div>
            <Button onClick={expandDisk} disabled={expandReq.loading}>
              {expandReq.loading ? <Loader2 className="tw:size-3.5 tw:animate-spin" /> : null}
              Expand host filesystem
            </Button>
          </div>
        )}

        {/* Result */}
        {expandReq.result && (
          <Alert>
            <CheckCircle2 className="tw:size-4 tw:text-green-500" />
            <AlertDescription>{expandReq.result}</AlertDescription>
          </Alert>
        )}

        {expandError && (
          <Alert variant="destructive">
            <TriangleAlert className="tw:size-4" />
            <AlertDescription>{expandError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
