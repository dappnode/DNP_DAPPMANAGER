import React, { useState } from "react";
import { api, apiRoutes } from "api";
// Components
import { confirm } from "components/ConfirmDialog";
import Button from "components/Button";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import { withToastNoThrow } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
// Utils
import { prettyDnpName } from "utils/format";
import humanFS from "utils/humanFileSize";
import { ReqStatus } from "types";
import { PackageBackup } from "@dappnode/types";

type ProgressType = { label: string; percent?: number };
type UploadReqStatus = ReqStatus<true, ProgressType>;

export function BackupRestore({
  dnpName,
  backup
}: {
  dnpName: string;
  backup: PackageBackup[];
}) {
  const [reqStatus, setReqStatus] = useState<UploadReqStatus>({});
  const isOnProgress = Boolean(reqStatus.loading !== undefined);

  /**
   * Restores a DNP backup given a backup file
   */
  async function restoreBackup(file: File) {
    try {
      setReqStatus({ loading: { label: "Uploading file" } });

      const { fileId } = await apiRoutes.uploadFile(file, progressData => {
        const { loaded, total } = progressData;
        const percent = parseFloat(
          ((100 * (loaded || 0)) / (total || 1)).toFixed(2)
        );
        const label = `${percent}% ${humanFS(loaded)} / ${humanFS(total)}`;
        setReqStatus({ loading: { percent, label } });
      });

      setReqStatus({ loading: { label: "Restoring backup..." } });

      await withToastNoThrow(
        () => api.backupRestore({ dnpName, backup, fileId }),
        {
          message: `Restoring backup for ${prettyDnpName(dnpName)}...`,
          onSuccess: `Restored backup for ${prettyDnpName(dnpName)}`
        }
      );

      setReqStatus({ result: true });
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  function handleClickRestore(file: File) {
    confirm({
      title: `Restoring backup`,
      text: `This action cannot be undone. The backup data will overwrite any previously existing data.`,
      list: [
        { title: "Selected file", body: `${file.name} (${humanFS(file.size)})` }
      ],
      label: "Restore",
      onClick: () => restoreBackup(file)
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

      {reqStatus.loading && (
        <div>
          <ProgressBar
            now={reqStatus.loading.percent || 100}
            animated={true}
            label={reqStatus.loading.label || ""}
          />
        </div>
      )}

      {reqStatus.error && <ErrorView error={reqStatus.error} red hideIcon />}
    </>
  );
}
