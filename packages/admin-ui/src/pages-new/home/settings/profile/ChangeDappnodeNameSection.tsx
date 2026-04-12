import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { api } from "api";
import { toast } from "sonner";
import { getDappnodeName } from "services/dappnodeStatus/selectors";
import { fetchSystemInfo } from "services/dappnodeStatus/actions";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";

export function ChangeDappnodeNameSection() {
  const dappnodeWebName = useSelector(getDappnodeName);
  const [input, setInput] = useState(dappnodeWebName);
  const dispatch = useDispatch();

  useEffect(() => {
    setInput(dappnodeWebName);
  }, [dappnodeWebName]);

  async function onChangeName() {
    try {
      toast.loading("Setting Dappnode name...");
      await api.dappnodeWebNameSet({ dappnodeWebName: input });
      toast.success("Dappnode name changed successfully");
      dispatch(fetchSystemInfo());
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Dappnode Name</CardTitle>
        <CardDescription>Customize the display name of your Dappnode.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:space-y-2">
          <Label htmlFor="dappnode-name">Name</Label>
          <Input id="dappnode-name" value={input} onChange={(e) => setInput(e.target.value)} />
        </div>
        <Button onClick={onChangeName} disabled={!input || input === dappnodeWebName}>
          Change Name
        </Button>
      </CardContent>
    </Card>
  );
}
