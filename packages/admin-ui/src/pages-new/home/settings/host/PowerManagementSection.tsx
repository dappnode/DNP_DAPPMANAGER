import React from "react";
import { api } from "api";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "components/primitives/card";
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
import { Power, RotateCcw } from "lucide-react";

export function PowerManagementSection() {
  async function reboot() {
    try {
      toast.loading("Rebooting host...");
      await api.rebootHost();
      toast.success("Reboot command sent");
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function powerOff() {
    try {
      toast.loading("Powering off host...");
      await api.poweroffHost();
      toast.success("Power off command sent");
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Power Management</CardTitle>
        <CardDescription>
          Only use these as a last resort when all other troubleshooting options have been exhausted.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RotateCcw className="tw:size-3.5" />
              Reboot
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reboot host</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to reboot the host machine? Only do this if it&apos;s strictly necessary.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={reboot}>Reboot</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Power className="tw:size-3.5" />
              Power Off
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Power off host</AlertDialogTitle>
              <AlertDialogDescription>
                WARNING! Your machine will power off and you will not be able to turn it back on without physical
                access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={powerOff}>Power Off</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
