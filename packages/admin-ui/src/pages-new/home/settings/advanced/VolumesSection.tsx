import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getVolumes } from "services/dappnodeStatus/selectors";
import { volumeRemove, packageVolumeRemove } from "pages/system/actions";
import { getPrettyVolumeName, getPrettyVolumeOwner, prettyBytes } from "utils/format";
import { parseStaticDate } from "utils/dates";
import type { VolumeData } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
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
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

const MIN_VOLUME_SIZE = 10 * 1024 * 1024; // 10 MB

export function VolumesSection() {
  const [showAll, setShowAll] = useState(false);
  const volumes = useSelector(getVolumes);
  const dispatch = useDispatch();

  const getSize = (v: VolumeData) => v.size || v.fileSystem?.used || 0;
  const sorted = [...volumes]
    .sort((v1, v2) => getSize(v2) - getSize(v1))
    .sort((v1, v2) => (v1.isOrphan && !v2.isOrphan ? -1 : 1));

  const displayed = showAll ? sorted : sorted.filter((v) => getSize(v) > MIN_VOLUME_SIZE).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Volumes</CardTitle>
        <CardDescription>
          Docker volumes used by your Dappnode packages. Orphan volumes can be safely removed.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-3">
        {displayed.length === 0 && (
          <p className="tw:text-sm tw:text-muted-foreground">No volumes found.</p>
        )}
        <div className="tw:rounded-lg tw:border tw:overflow-hidden">
          <table className="tw:w-full tw:text-sm">
            <thead className="tw:bg-muted/50">
              <tr>
                <th className="tw:p-2 tw:text-left tw:font-medium">Name</th>
                <th className="tw:p-2 tw:text-right tw:font-medium">Size</th>
                <th className="tw:p-2 tw:text-left tw:font-medium">Created</th>
                <th className="tw:p-2 tw:text-center tw:font-medium tw:w-16">Remove</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((vol) => {
                const ownerPretty = getPrettyVolumeOwner(vol);
                const namePretty = getPrettyVolumeName(vol);
                const isDeletable = Boolean(vol.isOrphan || vol.owner);
                const onDelete = vol.isOrphan
                  ? () => dispatch(volumeRemove(vol.name))
                  : vol.owner
                    ? () => dispatch(packageVolumeRemove(vol.owner!, vol.name))
                    : undefined;

                return (
                  <tr key={vol.name} className="tw:border-t">
                    <td className="tw:p-2">
                      <div className="tw:flex tw:items-center tw:gap-1.5">
                        {ownerPretty && (
                          <span className="tw:text-muted-foreground">{ownerPretty} —</span>
                        )}
                        <span>{namePretty}</span>
                        {vol.isOrphan && <Badge variant="destructive">Orphan</Badge>}
                      </div>
                    </td>
                    <td className="tw:p-2 tw:text-right tw:tabular-nums">
                      {prettyBytes(getSize(vol))}
                    </td>
                    <td className="tw:p-2 tw:text-muted-foreground">
                      {parseStaticDate(vol.createdAt, true)}
                    </td>
                    <td className="tw:p-2 tw:text-center">
                      {isDeletable && onDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="tw:size-3.5 tw:text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove volume</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove &quot;{namePretty}&quot;? This action
                                cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={onDelete}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll((x) => !x)}
          className="tw:w-full"
        >
          {showAll ? (
            <>
              <ChevronUp className="tw:size-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="tw:size-3.5" /> Show all ({volumes.length})
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
