import React, { useState } from "react";
import { api, apiRoutes } from "api";
// Components
import Button from "components/Button";
import ProgressBar from "react-bootstrap/esm/ProgressBar";
import Alert from "react-bootstrap/esm/Alert";
import { withToast } from "components/toast/Toast";
import ErrorView from "components/ErrorView";
// Utils
import { prettyDnpName } from "utils/format";
import newTabProps from "utils/newTabProps";
import { PackageBackup } from "@dappnode/dappnodesdk/dist/types";
import { ReqStatus } from "types";

export function BackupDownload({
  dnpName,
  backup
}: {
  dnpName: string;
  backup: PackageBackup[];
}) {
  const [reqStatus, setReqStatus] = useState<ReqStatus<string>>({});

  /**
   * Prepares a backup for download
   */
  async function prepareBackupForDownload() {
    try {
      setReqStatus({ loading: true });
      const fileId = await withToast(() => api.backupGet({ dnpName, backup }), {
        message: `Preparing backup for ${prettyDnpName(dnpName)}...`,
        onSuccess: `Backup for ${prettyDnpName(dnpName)} ready`
      });

      if (!fileId) throw Error("Error preparing backup, no fileId returned");
      const backupDownloadUrl = apiRoutes.downloadUrl({ fileId });
      window.open(backupDownloadUrl, "_newtab");

      setReqStatus({ result: backupDownloadUrl });
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on prepareBackupForDownload", e);
    }
  }

  return (
    <>
      <p>
        Download a backup of the critical files of this package in your local
        machine.
      </p>

      {reqStatus.result ? (
        <>
          <a href={reqStatus.result} {...newTabProps} className="no-a-style">
            <Button variant="dappnode">Download backup</Button>
            <div
              style={{
                opacity: 0.7,
                fontSize: "0.8rem",
                marginTop: "0.5rem"
              }}
            >
              Allow browser pop-ups or click download
            </div>
          </a>
          <Alert variant="warning" className="alert-download-sensitive">
            This backup may contain sensitive data such as private keys. Make
            sure to store it safely
          </Alert>
        </>
      ) : (
        <Button
          onClick={prepareBackupForDownload}
          disabled={reqStatus.loading}
          variant="dappnode"
        >
          Backup now
        </Button>
      )}

      {reqStatus.loading && (
        <div>
          <ProgressBar now={100} animated={true} label="Preparing backup" />
        </div>
      )}

      {reqStatus.error && <ErrorView error={reqStatus.error} red hideIcon />}
    </>
  );
}
