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
import { ArrowUpCircle } from "lucide-react";

export function UpdateUpgradeSection() {
  async function updateUpgrade() {
    const toastId = toast.loading("Updating and upgrading...");
    try {
      await api.updateUpgrade();
      toast.success("Updated and upgraded successfully", { id: toastId });
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`, { id: toastId });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Update & Upgrade Host</CardTitle>
        <CardDescription>
          Update and upgrade the host machine&apos;s packages. This may require a reboot.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <ArrowUpCircle className="tw:size-3.5" />
              Update & Upgrade
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update and upgrade</AlertDialogTitle>
              <AlertDialogDescription>
                This action might update Docker among other packages. You might lose connectivity temporarily.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={updateUpgrade}>Proceed</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
