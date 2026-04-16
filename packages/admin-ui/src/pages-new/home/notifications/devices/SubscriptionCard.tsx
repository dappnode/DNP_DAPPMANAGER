import React, { useEffect, useRef, useState } from "react";
import { NotifierSubscription } from "@dappnode/types";
import { api } from "api";
import { Card, CardContent } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Badge } from "components/primitives/badge";
import { Input } from "components/primitives/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "components/primitives/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "components/primitives/alert-dialog";
import { Pencil, Trash2, Send, Check, X } from "lucide-react";
import { toast } from "sonner";

/* ── Props ──────────────────────────────────────────────────────────── */

interface SubscriptionCardProps {
  sub: NotifierSubscription;
  isCurrentDevice: boolean;
  deleteSubscription: (endpoint: string) => Promise<void>;
  revalidateSubs: () => Promise<boolean>;
}

/* ── Component ─────────────────────────────────────────────────────── */

export function SubscriptionCard({ sub, isCurrentDevice, deleteSubscription, revalidateSubs }: SubscriptionCardProps) {
  const [editing, setEditing] = useState(false);
  const [newAlias, setNewAlias] = useState(sub.alias);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function handleUpdateAlias() {
    if (!newAlias || newAlias === sub.alias) {
      setEditing(false);
      return;
    }
    try {
      await api.notificationsUpdateSubAlias({ endpoint: sub.endpoint || "", alias: newAlias });
      revalidateSubs();
      toast.success("Device renamed");
    } catch (error) {
      console.error("Error updating alias:", error);
      toast.error("Failed to rename device");
    } finally {
      setEditing(false);
    }
  }

  function cancelEdit() {
    setEditing(false);
    setNewAlias(sub.alias);
  }

  async function handleSendTest() {
    try {
      await api.notificationsSendSubTest({ endpoint: sub.endpoint });
      toast.success("Test notification sent");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    }
  }

  async function handleDelete() {
    if (!sub.endpoint) return;
    try {
      await deleteSubscription(sub.endpoint);
      toast.success("Device removed");
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error("Failed to remove device");
    }
  }

  return (
    <Card size="sm">
      <CardContent className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:flex-wrap">
        {/* Left: alias + current-device badge */}
        <div className="tw:flex tw:items-center tw:gap-2 tw:flex-1 tw:min-w-0">
          {editing ? (
            <Input
              ref={inputRef}
              value={newAlias}
              onChange={(e) => setNewAlias(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateAlias();
                if (e.key === "Escape") cancelEdit();
              }}
              className="tw:h-8 tw:max-w-60"
            />
          ) : (
            <span className="tw:font-medium tw:truncate">{sub.alias}</span>
          )}
          {isCurrentDevice && !editing && <Badge variant="success">This device</Badge>}
        </div>

        {/* Right: action buttons */}
        <div className="tw:flex tw:items-center tw:gap-1">
          {editing ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="tw:size-8" onClick={cancelEdit}>
                    <X className="tw:size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="tw:size-8"
                    onClick={handleUpdateAlias}
                    disabled={!newAlias || newAlias === sub.alias}
                  >
                    <Check className="tw:size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="tw:size-8" onClick={handleSendTest}>
                    <Send className="tw:size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send test notification</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="tw:size-8" onClick={() => setEditing(true)}>
                    <Pencil className="tw:size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Rename device</TooltipContent>
              </Tooltip>
              {sub.endpoint && (
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="tw:size-8 tw:text-destructive tw:hover:text-destructive"
                        onClick={() => setDeleteOpen(true)}
                      >
                        <Trash2 className="tw:size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove device</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove device</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove <strong>{sub.alias}</strong>? This device will no longer receive
                        push notifications.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
