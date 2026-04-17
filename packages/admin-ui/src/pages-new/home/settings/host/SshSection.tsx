import React, { useState, useEffect } from "react";
import { api } from "api";
import { toast } from "sonner";
import { ShhStatus } from "@dappnode/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Switch } from "components/primitives/switch";
import { Separator } from "components/primitives/separator";
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
import { Terminal, Loader2 } from "lucide-react";

export function SshSection() {
  const [sshStatus, setSshStatus] = useState<{ loading?: boolean; result?: ShhStatus; error?: unknown }>({});
  const [sshPort, setSshPort] = useState("");
  const [portFetched, setPortFetched] = useState(false);

  useEffect(() => {
    fetchSshStatus();
  }, []);

  async function fetchSshStatus() {
    try {
      setSshStatus({ loading: true });
      const status = await api.sshStatusGet();
      setSshStatus({ result: status });
    } catch (e) {
      setSshStatus({ error: e });
    }
  }

  async function changeSshStatus(status: ShhStatus) {
    const toastId = toast.loading(`${status === "enabled" ? "Enabling" : "Disabling"} SSH...`);
    try {
      await api.sshStatusSet({ status });
      toast.success(`SSH ${status === "enabled" ? "enabled" : "disabled"}`, { id: toastId });
      await fetchSshStatus();
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  async function fetchSshPort() {
    try {
      const port = await api.sshPortGet();
      setSshPort(String(port));
      setPortFetched(true);
    } catch (e) {
      toast.error(`Error fetching port: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function updateSshPort() {
    const portNum = parseInt(sshPort, 10);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      toast.error("Port must be between 1 and 65535");
      return;
    }
    const toastId = toast.loading("Changing SSH port...");
    try {
      await api.sshPortSet({ port: portNum });
      toast.success("SSH port changed", { id: toastId });
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  const isEnabled = sshStatus.result === "enabled";

  const sshErrorMsg = sshStatus.error
    ? `Error: ${sshStatus.error instanceof Error ? sshStatus.error.message : String(sshStatus.error)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">SSH Access</CardTitle>
        <CardDescription>Manage SSH access to your Dappnode host machine.</CardDescription>
      </CardHeader>
      <CardContent className="tw:space-y-4">
        <div className="tw:flex tw:items-center tw:justify-between">
          <div className="tw:flex tw:items-center tw:gap-2">
            <Terminal className="tw:size-4 tw:text-muted-foreground" />
            <Label htmlFor="ssh-toggle">SSH Service</Label>
            {sshStatus.loading && <Loader2 className="tw:size-3.5 tw:animate-spin tw:text-muted-foreground" />}
          </div>
          {sshStatus.result &&
            !sshStatus.loading &&
            (isEnabled ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Switch id="ssh-toggle" checked={true} />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable SSH</AlertDialogTitle>
                    <AlertDialogDescription>
                      Warning: you will lose SSH access. Make sure you have an alternative way to access your Dappnode
                      before disabling SSH.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => changeSshStatus("disabled")}>Disable</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Switch id="ssh-toggle" checked={false} onCheckedChange={() => changeSshStatus("enabled")} />
            ))}
        </div>

        {isEnabled && (
          <>
            <Separator />
            <div className="tw:space-y-2">
              <Label htmlFor="ssh-port">SSH Port</Label>
              <div className="tw:flex tw:gap-2">
                <Input
                  id="ssh-port"
                  type="number"
                  placeholder="22"
                  value={sshPort}
                  onChange={(e) => setSshPort(e.target.value)}
                  className="tw:w-32"
                />
                <Button variant="outline" size="sm" onClick={fetchSshPort}>
                  Fetch Port
                </Button>
                <Button size="sm" disabled={!sshPort || !portFetched} onClick={updateSshPort}>
                  Change
                </Button>
              </div>
            </div>
          </>
        )}

        {sshErrorMsg && <p className="tw:text-sm tw:text-destructive">{sshErrorMsg}</p>}
      </CardContent>
    </Card>
  );
}
