import React from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { prettyDnpName } from "utils/format";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Switch } from "components/primitives/switch";
import { Label } from "components/primitives/label";
import { Skeleton } from "components/primitives/skeleton";

export function AutoUpdatesSection() {
  const autoUpdateDataReq = useApi.autoUpdateDataGet();

  async function setUpdateSettings(id: string, enabled: boolean) {
    const prettyName = prettyDnpName(id);
    const actioning = enabled ? "Enabling" : "Disabling";
    const actioned = enabled ? "Enabled" : "Disabled";
    try {
      toast.loading(`${actioning} auto updates for ${prettyName}...`);
      await api.autoUpdateSettingsEdit({ id, enabled });
      toast.success(`${actioned} auto updates for ${prettyName}`);
      autoUpdateDataReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (autoUpdateDataReq.isValidating && !autoUpdateDataReq.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="tw:text-base">Auto Updates</CardTitle>
        </CardHeader>
        <CardContent className="tw:space-y-3">
          <Skeleton className="tw:h-8 tw:w-full" />
          <Skeleton className="tw:h-8 tw:w-full" />
        </CardContent>
      </Card>
    );
  }

  const dnpsToShow = autoUpdateDataReq.data?.dnpsToShow || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Auto Updates</CardTitle>
        <CardDescription>
          Enable auto-updates to install the latest versions automatically. Major breaking updates always require your
          approval.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-3">
        {dnpsToShow.map(({ id, displayName, enabled }) => (
          <div key={id} className="tw:flex tw:items-center tw:justify-between tw:py-1">
            <Label htmlFor={`auto-update-${id}`} className="tw:cursor-pointer">
              {displayName}
            </Label>
            <Switch
              id={`auto-update-${id}`}
              checked={enabled}
              onCheckedChange={(checked) => setUpdateSettings(id, checked)}
            />
          </div>
        ))}
        {dnpsToShow.length === 0 && (
          <p className="tw:text-sm tw:text-muted-foreground">No packages available for auto-updates.</p>
        )}
      </CardContent>
    </Card>
  );
}
