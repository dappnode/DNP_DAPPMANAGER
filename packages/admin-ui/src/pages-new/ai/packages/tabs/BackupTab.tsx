import React, { useState, useRef } from "react";
import { api, apiRoutes } from "api";
import { toast } from "sonner";
import { PackageBackup } from "@dappnode/types";
import { prettyDnpName } from "utils/format";
import humanFileSize from "utils/humanFileSize";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Progress } from "components/primitives/progress";
import { Alert, AlertTitle, AlertDescription } from "components/primitives/alert";
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
import { Download, Upload, TriangleAlert, Archive } from "lucide-react";

export function BackupTab({ dnpName, backup }: { dnpName: string; backup: PackageBackup[] }) {
  if (!Array.isArray(backup) || backup.length === 0) return null;

  return (
    <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2 tw:gap-6">
      <BackupDownloadCard dnpName={dnpName} backup={backup} />
      <BackupRestoreCard dnpName={dnpName} backup={backup} />
    </div>
  );
}

/* ── Download backup ────────────────────────────────────────────────── */

function BackupDownloadCard({ dnpName, backup }: { dnpName: string; backup: PackageBackup[] }) {
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>();

  async function prepareBackup() {
    const prettyName = prettyDnpName(dnpName);
    try {
      setLoading(true);
      toast.loading(`Preparing backup for ${prettyName}…`, { id: "backup-dl" });
      const fileId = await api.backupGet({ dnpName, backup });
      if (!fileId) throw Error("No fileId returned");
      const url = apiRoutes.downloadUrl({ fileId });
      window.open(url, "_newtab");
      setDownloadUrl(url);
      toast.success(`Backup for ${prettyName} ready`, { id: "backup-dl" });
    } catch (e) {
      toast.error(`Failed to prepare backup: ${e}`, { id: "backup-dl" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <Download className="tw:size-4" />
          Download Backup
        </CardTitle>
        <CardDescription>
          Download a backup of the critical files of this package to your local machine.
        </CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {downloadUrl ? (
          <>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <Download className="tw:size-3.5 tw:mr-1.5" />
                Download backup
              </Button>
            </a>
            <p className="tw:text-xs tw:text-muted-foreground">Allow browser pop-ups or click download.</p>
            <Alert>
              <TriangleAlert className="tw:size-4" />
              <AlertTitle>Sensitive data</AlertTitle>
              <AlertDescription>This backup may contain private keys. Store it safely.</AlertDescription>
            </Alert>
          </>
        ) : (
          <Button onClick={prepareBackup} disabled={loading}>
            <Archive className="tw:size-3.5 tw:mr-1.5" />
            {loading ? "Preparing…" : "Backup now"}
          </Button>
        )}

        {loading && <Progress value={100} className="tw:animate-pulse" />}
      </CardContent>
    </Card>
  );
}

/* ── Restore backup ─────────────────────────────────────────────────── */

function BackupRestoreCard({ dnpName, backup }: { dnpName: string; backup: PackageBackup[] }) {
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState<{ label: string; percent?: number }>();
  const [selectedFile, setSelectedFile] = useState<File>();
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function doRestore(file: File) {
    const prettyName = prettyDnpName(dnpName);
    try {
      setRestoring(true);
      setProgress({ label: "Uploading file…" });

      const { fileId } = await apiRoutes.uploadFile(file, (ev) => {
        const percent = parseFloat(((100 * (ev.loaded || 0)) / (ev.total || 1)).toFixed(2));
        setProgress({ percent, label: `${percent}% ${humanFileSize(ev.loaded)} / ${humanFileSize(ev.total)}` });
      });

      setProgress({ label: "Restoring backup…" });
      toast.loading(`Restoring backup for ${prettyName}…`, { id: "backup-restore" });
      await api.backupRestore({ dnpName, backup, fileId });
      toast.success(`Restored backup for ${prettyName}`, { id: "backup-restore" });
    } catch (e) {
      toast.error(`Restore failed: ${e}`, { id: "backup-restore" });
    } finally {
      setRestoring(false);
      setProgress(undefined);
      setSelectedFile(undefined);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowConfirm(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="tw:flex tw:items-center tw:gap-2">
            <Upload className="tw:size-4" />
            Restore Backup
          </CardTitle>
          <CardDescription>Restore from an existing backup. This will overwrite existing data.</CardDescription>
        </CardHeader>
        <CardContent className="tw:flex tw:flex-col tw:gap-4">
          <div>
            <Button variant="outline" disabled={restoring} onClick={() => inputRef.current?.click()}>
              <Upload className="tw:size-3.5 tw:mr-1.5" />
              {restoring ? "Restoring…" : "Select backup file"}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".tar,.xz,.tar.xz,.zip"
              className="tw:hidden"
              onChange={handleFileSelect}
              disabled={restoring}
            />
          </div>

          {progress && (
            <div className="tw:flex tw:flex-col tw:gap-1.5">
              <Progress value={progress.percent ?? 100} className={!progress.percent ? "tw:animate-pulse" : ""} />
              <p className="tw:text-xs tw:text-muted-foreground">{progress.label}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="tw-base">
          <AlertDialogHeader>
            <AlertDialogTitle>Restore backup</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The backup data will overwrite any existing data.
              {selectedFile && (
                <span className="tw:block tw:mt-2 tw:font-medium">
                  Selected file: {selectedFile.name} ({humanFileSize(selectedFile.size)})
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFile(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedFile) doRestore(selectedFile);
                setShowConfirm(false);
              }}
            >
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
