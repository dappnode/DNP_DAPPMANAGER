import React from "react";
import { api, useApi } from "api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Switch } from "components/primitives/switch";
import { Label } from "components/primitives/label";

export function ContentProviderSection() {
  const mirrorProviderReq = useApi.mirrorProviderGet();
  const enabled = mirrorProviderReq.data?.enabled ?? false;

  async function handleToggle() {
    try {
      toast.loading(`${enabled ? "Disabling" : "Enabling"} content provider...`);
      await api.mirrorProviderSet({ enabled: !enabled });
      toast.success(`Content provider ${enabled ? "disabled" : "enabled"}`);
      mirrorProviderReq.revalidate();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Content Provider</CardTitle>
        <CardDescription>
          When enabled, packages are downloaded from the Dappnode content provider first instead of IPFS.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="tw:flex tw:items-center tw:justify-between">
          <Label htmlFor="content-provider">Use Dappnode Content Provider</Label>
          <Switch
            id="content-provider"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={mirrorProviderReq.isValidating || !mirrorProviderReq.data}
          />
        </div>
      </CardContent>
    </Card>
  );
}
