import React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "api";
import { toast } from "sonner";
import { InstalledPackageDetailData } from "@dappnode/types";
import { Card, CardContent } from "components/primitives/card";
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
import { prettyDnpName } from "utils/format";
import { Trash2 } from "lucide-react";

export function RemovePackageCard({ dnp }: { dnp: InstalledPackageDetailData }) {
  const navigate = useNavigate();
  const { dnpName, areThereVolumesToRemove, dependantsOf, notRemovable, manifest } = dnp;

  if (notRemovable) return null;

  const removeWarnings = manifest?.warnings?.onRemove;
  const depList = dependantsOf.length > 0 ? dependantsOf.map((d) => prettyDnpName(d)).join(", ") : null;

  async function doRemove(deleteVolumes: boolean) {
    const prettyName = prettyDnpName(dnpName);
    try {
      toast.loading(`Removing ${prettyName}${deleteVolumes ? " and data" : ""}…`, { id: "pkg-rm" });
      await api.packageRemove({ dnpName, deleteVolumes });
      toast.success(`Removed ${prettyName}`, { id: "pkg-rm" });
      navigate("/ai/packages");
    } catch (e) {
      toast.error(`Failed: ${e}`, { id: "pkg-rm" });
    }
  }

  return (
    <Card className="tw:border-destructive/30">
      <CardContent className="tw:flex tw:items-center tw:justify-between tw:pt-4">
        <div>
          <p className="tw:text-sm tw:font-medium">Remove package</p>
          <p className="tw:text-xs tw:text-muted-foreground">Delete {prettyDnpName(dnpName)} permanently.</p>
        </div>
        <div className="tw:flex tw:gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="tw:size-3.5 tw:mr-1.5" />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="tw-base">
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {prettyDnpName(dnpName)}</AlertDialogTitle>
                <AlertDialogDescription className="tw:flex tw:flex-col tw:gap-2">
                  <span>This action cannot be undone.</span>
                  {removeWarnings && <span className="tw:text-destructive">{removeWarnings}</span>}
                  {depList && (
                    <span className="tw:text-destructive">
                      Warning: {depList} depend on {prettyDnpName(dnpName)} and may stop working.
                    </span>
                  )}
                  {areThereVolumesToRemove && (
                    <span>
                      If you do NOT want to keep the package&apos;s data, choose &quot;Remove &amp; delete data&quot;.
                    </span>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => doRemove(false)}>
                  Remove
                </AlertDialogAction>
                {areThereVolumesToRemove && (
                  <AlertDialogAction variant="destructive" onClick={() => doRemove(true)}>
                    Remove & delete data
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
