import React, { useState, useCallback } from "react";
import { api } from "api";
import { toast } from "sonner";
import { prettyDnpName } from "utils/format";
import { autoUpdateIds } from "params";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "components/primitives/dialog";
import { Button } from "components/primitives/button";

const { MY_PACKAGES } = autoUpdateIds;

interface AutoUpdatesDialogProps {
  /** The dnpName to enable auto-updates for */
  dnpName: string;
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close */
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog that prompts the user to enable auto-updates for a
 * freshly installed package. Replaces the legacy `confirm()` +
 * `withToastNoThrow()` pattern with new primitives.
 *
 * The user can:
 *  - Enable auto-updates for **this package only**
 *  - Enable auto-updates for **all packages**
 *  - Dismiss without enabling
 */
export function AutoUpdatesDialog({ dnpName, open, onOpenChange }: AutoUpdatesDialogProps) {
  const [loading, setLoading] = useState(false);
  const prettyName = prettyDnpName(dnpName);

  const enableAutoUpdates = useCallback(
    async (forAll: boolean) => {
      const id = forAll ? MY_PACKAGES : dnpName;
      const logId = forAll ? "all packages" : prettyName;

      try {
        setLoading(true);
        toast.loading(`Enabling auto-updates for ${logId}…`, { id: `auto-update-${dnpName}` });
        await api.autoUpdateSettingsEdit({ id, enabled: true });
        toast.success(`Enabled auto-updates for ${logId}`, { id: `auto-update-${dnpName}` });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        toast.error(`Failed to enable auto-updates for ${logId}`, {
          id: `auto-update-${dnpName}`,
          description: message
        });
        console.error("Error enabling auto-updates", e);
      } finally {
        setLoading(false);
        onOpenChange(false);
      }
    },
    [dnpName, prettyName, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable auto-updates</DialogTitle>
          <DialogDescription>
            Do you want to enable auto-updates for <strong>{prettyName}</strong> so DAppNode installs the latest
            versions automatically?
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => enableAutoUpdates(true)} disabled={loading}>
            Enable for all packages
          </Button>
          <Button onClick={() => enableAutoUpdates(false)} disabled={loading}>
            Enable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Checks whether auto-updates should be prompted for a package.
 * Returns `true` when auto-updates are not yet enabled for the
 * package **and** not enabled globally for all packages.
 */
export async function shouldPromptAutoUpdates(dnpName: string): Promise<boolean> {
  try {
    const { settings } = await api.autoUpdateDataGet();
    const enabledForAll = settings[MY_PACKAGES]?.enabled;
    const enabledForPkg = settings[dnpName]?.enabled;
    return !enabledForAll && !enabledForPkg;
  } catch (e) {
    console.error("Error checking auto-update status", e);
    return false;
  }
}
