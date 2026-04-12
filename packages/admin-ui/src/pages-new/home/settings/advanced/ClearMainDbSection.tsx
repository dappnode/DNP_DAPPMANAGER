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

export function ClearMainDbSection() {
  async function cleanDb() {
    try {
      toast.loading("Deleting main database...");
      await api.cleanDb();
      toast.success("Main database deleted");
    } catch (e) {
      toast.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:text-base">Clear Main Database</CardTitle>
        <CardDescription>
          Remove the local database containing dyndns identity, IP registry, telegram configuration and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Clear Main Database</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete main database</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. You should only delete the database in response to a problem.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={cleanDb}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
