import React, { useState } from "react";
import { api } from "api";
import { confirm } from "components/ConfirmDialog";
// Components
import Button from "components/Button";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import { withToastNoThrow } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
// Utils
import { shortName } from "utils/format";
import humanFS from "utils/humanFileSize";
import { PackageBackup } from "types";
import { apiUrls } from "params";

const baseUrlUpload = apiUrls.upload;

export function BackupRestore({
  dnpName,
  backup
}: {
  dnpName: string;
  backup: PackageBackup[];
}) {
  const [progress, setProgress] = useState<{
    label: string;
    percent?: number;
  }>();
  const [error, setError] = useState<string | Error>();
  const isOnProgress = Boolean(progress && progress.label);

  /**
   * Restores a DNP backup given a backup file
   * @param file
   */
  async function restoreBackup(file: File) {
    setError(undefined);

    const xhr = new XMLHttpRequest();
    // Bind the FormData object and the form element
    const formData = new FormData();
    formData.append("file", file);

    // Define what happens on successful data submission
    xhr.addEventListener("load", e => {
      setProgress(undefined);
      if (!e.target) return setError(`No upload responseText`);
      // ### Pending bug: .responseText is not typed in XMLHttpRequestEventTarget
      const fileId = (e.target as any).responseText;
      // if responseText is not a 32bytes hex, abort
      if (!/[0-9A-Fa-f]{64}/.test(fileId))
        return setError(`Wrong response: ${fileId}`);

      setProgress({ label: "Restoring backup..." });
      withToastNoThrow(() => api.backupRestore({ dnpName, backup, fileId }), {
        message: `Restoring backup for ${shortName(dnpName)}...`,
        onSuccess: `Restored backup for ${shortName(dnpName)}`
      }).then(() => {
        setProgress(undefined);
      });
    });

    // Define what happens in case of error
    xhr.addEventListener("error", e => {
      setProgress(undefined);
      setError("Error loading file");
    });

    if (xhr.upload)
      xhr.upload.addEventListener(
        "progress",
        e => {
          const { loaded, total } = e;
          const percent = parseFloat(
            ((100 * (loaded || 0)) / (total || 1)).toFixed(2)
          );
          setProgress({
            percent,
            label: `${percent}% ${humanFS(loaded)} / ${humanFS(total)}`
          });
        },
        false
      );

    // Set up our request
    xhr.open("POST", baseUrlUpload);
    // The data sent is what the user provided in the form
    xhr.send(formData);
  }

  function handleClickRestore(file: File) {
    confirm({
      title: `Restoring backup`,
      text: `This action cannot be undone. The backup data will overwrite any previously existing data.`,
      list: [
        { title: "Selected file", body: `${file.name} (${humanFS(file.size)})` }
      ],
      label: "Restore",
      onClick: () => restoreBackup(file),
      variant: "dappnode"
    });
  }

  // Only render the component if a backup mechanism is provided
  if (!Array.isArray(backup)) return null;

  return (
    <>
      <p>
        Restore an existing backup. Note that this action will overwrite
        existing data.
      </p>

      <Button className="button-file-input" disabled={isOnProgress}>
        <span>Restore</span>
        <input
          type="file"
          id="backup_upload"
          name="file"
          accept=".tar, .xz, .tar.xz, .zip"
          onChange={e => {
            if (e.target.files) handleClickRestore(e.target.files[0]);
          }}
          disabled={isOnProgress}
        />
      </Button>

      {progress && (
        <div>
          <ProgressBar
            now={progress.percent || 100}
            animated={true}
            label={progress.label || ""}
          />
        </div>
      )}

      {error && <ErrorView error={error} red hideIcon />}
    </>
  );
}
