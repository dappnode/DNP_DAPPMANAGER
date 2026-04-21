import React, { useState } from "react";
import { api } from "api";
import { useSelector } from "react-redux";
import { getVolumes } from "services/dappnodeStatus/selectors";
import { toast } from "sonner";
import { flatten, uniqBy, orderBy } from "lodash-es";
import { InstalledPackageDetailData } from "@dappnode/types";
import { Card, CardContent, CardHeader, CardTitle } from "components/primitives/card";
import { Button } from "components/primitives/button";
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
import { prettyDnpName, prettyVolumeName, prettyBytes } from "utils/format";
import { Trash2, ChevronDown, ChevronUp, HardDrive } from "lucide-react";

export function VolumesCard({ dnp }: { dnp: InstalledPackageDetailData }) {
  const [expanded, setExpanded] = useState(false);
  const volumesData = useSelector(getVolumes);

  const volumes = uniqBy(flatten(dnp.containers.map((c) => c.volumes)), (v) => v.name)
    .filter((v) => v.name)
    .sort((v1) => (v1.name ? -1 : 1))
    .sort((v1) => ((v1.name || "").includes("data") ? -1 : 0))
    .map(({ name, container, host }) => {
      const vd = volumesData.find((v) => v.name === name);
      const prettyVol = prettyVolumeName(name || "", dnp.dnpName);
      const prettyStr = [prettyVol.owner, prettyVol.name].filter(Boolean).join(" – ");
      return {
        name: name || host,
        prettyName: name ? prettyStr : container || "Unknown",
        size: vd?.size
      };
    });

  if (volumes.length === 0) return null;

  const totalSize = volumes.reduce((s, v) => (v.size != null ? s + v.size : s), 0);

  async function doRemoveVolumes(volumeName?: string) {
    const prettyName = prettyDnpName(dnp.dnpName);
    const toastId = `vol-rm-${volumeName || "all"}`;
    try {
      toast.loading(`Removing volumes of ${prettyName}…`, { id: toastId });
      await api.packageRestartVolumes({ dnpName: dnp.dnpName, volumeId: volumeName });
      toast.success(`Removed volumes of ${prettyName}`, { id: toastId });
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: toastId });
    }
  }

  function RemoveVolumeButton({ volumeName, label }: { volumeName?: string; label: string }) {
    const prettyName = prettyDnpName(dnp.dnpName);
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="tw:size-7 tw:text-destructive tw:hover:text-destructive"
            title={`Remove ${label}`}
          >
            <Trash2 className="tw:size-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="tw-base">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {label}</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {volumeName ? prettyDnpName(volumeName) : "all"} volume data for {prettyName}? This cannot be
              undone. Blockchain nodes will re-sync from scratch.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => doRemoveVolumes(volumeName)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volumes</CardTitle>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:divide-y tw:divide-border">
        <div className="tw:flex tw:items-center tw:gap-3 tw:py-2">
          <HardDrive className="tw:size-4 tw:text-muted-foreground" />
          <span className="tw:flex-1 tw:text-sm tw:font-medium">All volumes</span>
          <span className="tw:text-xs tw:text-muted-foreground">{prettyBytes(totalSize)}</span>

          {volumes.length > 1 && (
            <Button variant="ghost" size="icon" className="tw:size-7" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronUp className="tw:size-3.5" /> : <ChevronDown className="tw:size-3.5" />}
            </Button>
          )}

          <RemoveVolumeButton label="all volumes" />
        </div>

        {expanded &&
          orderBy(volumes, ["size", "prettyName"], ["desc", "asc"]).map((vol) => (
            <div key={vol.name} className="tw:flex tw:items-center tw:gap-3 tw:py-2 tw:pl-6">
              <span className="tw:flex-1 tw:text-sm tw:truncate">{prettyDnpName(vol.prettyName)}</span>
              <span className="tw:text-xs tw:text-muted-foreground">
                {typeof vol.size === "number" ? prettyBytes(vol.size) : "–"}
              </span>
              <RemoveVolumeButton volumeName={vol.name} label={prettyDnpName(vol.prettyName)} />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
