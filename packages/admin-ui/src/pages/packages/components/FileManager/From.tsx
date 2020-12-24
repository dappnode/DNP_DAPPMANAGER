import React, { useState, useEffect, useCallback } from "react";
import { fileDownloadUrl } from "api/routes";
import Input from "components/Input";
import Button from "components/Button";
import newTabProps from "utils/newTabProps";

export function CopyFileFrom({
  containerName,
  fromPathDefault
}: {
  containerName: string;
  fromPathDefault?: string;
}) {
  const [fromPathInput, setFromPathInput] = useState("");

  const getDownloadUrl = useCallback(
    fromPath => fileDownloadUrl({ containerName, path: fromPath }),
    [containerName]
  );

  const downloadFile = useCallback(
    fromPath => window.open(getDownloadUrl(fromPath), "_newtab"),
    [getDownloadUrl]
  );

  useEffect(() => {
    if (fromPathDefault) {
      setFromPathInput(fromPathDefault);
      downloadFile(fromPathDefault);
    }
  }, [fromPathDefault, containerName, downloadFile]);

  return (
    <div className="card-subgroup">
      {/* FROM, chose path */}
      <Input
        placeholder="Container from path"
        value={fromPathInput}
        onValueChange={setFromPathInput}
        onEnterPress={() => downloadFile(fromPathInput)}
        append={
          <a
            href={getDownloadUrl(fromPathInput)}
            {...newTabProps}
            className="no-a-style"
          >
            <Button variant="dappnode">Download</Button>
          </a>
        }
      />
    </div>
  );
}
