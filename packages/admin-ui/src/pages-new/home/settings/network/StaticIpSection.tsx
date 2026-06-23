import React, { useState, useEffect } from "react";
import { api } from "api";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { getStaticIp } from "services/dappnodeStatus/selectors";
import isIpv4 from "utils/isIpv4";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";

export function StaticIpSection() {
  const staticIp = useSelector(getStaticIp);
  const [input, setInput] = useState(staticIp || "");

  useEffect(() => {
    setInput(staticIp || "");
  }, [staticIp]);

  async function updateStaticIp(newStaticIp: string) {
    const toastId = toast.loading("Setting static IP...");
    try {
      await api.setStaticIp({ staticIp: newStaticIp });
      toast.success(newStaticIp ? "Static IP set" : "Static IP disabled", { id: toastId });
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Static IP</CardTitle>
        <CardDescription>
          Set a static IP for your Dappnode. If you have a static IP, enable it here for proper VPN and connectivity.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:space-y-2">
          <Label htmlFor="static-ip">IP Address</Label>
          <Input
            id="static-ip"
            placeholder="e.g., 85.200.85.20"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="tw:flex tw:gap-2">
          <Button
            disabled={!isIpv4(input) || (Boolean(staticIp) && staticIp === input)}
            onClick={() => updateStaticIp(input)}
          >
            {staticIp ? "Update" : "Enable"}
          </Button>
          {staticIp && (
            <Button variant="outline" onClick={() => updateStaticIp("")}>
              Disable
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
