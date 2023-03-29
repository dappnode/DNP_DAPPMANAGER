import React from "react";
import Card from "components/Card";
import Columns from "components/Columns";
import { BackupDownload } from "./Download";
import { BackupRestore } from "./Restore";
import "./backup.scss";
import { PackageBackup } from "@dappnode/dappnodesdk/dist/types";

export function Backup({
  dnpName,
  backup
}: {
  dnpName: string;
  backup: PackageBackup[];
}) {
  // Only render the component if a backup mechanism is provided
  if (!Array.isArray(backup)) return null;

  return (
    <Card className="backup">
      <Columns spacing>
        <div>
          <div className="subtle-header">DOWNLOAD BACKUP</div>
          <BackupDownload dnpName={dnpName} backup={backup} />
        </div>

        <div>
          <div className="subtle-header">RESTORE BACKUP</div>
          <BackupRestore dnpName={dnpName} backup={backup} />
        </div>
      </Columns>
    </Card>
  );
}
