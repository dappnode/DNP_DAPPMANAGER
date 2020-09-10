import React, { useState, useEffect, useCallback } from "react";
import { api } from "api";
// Components
import Input from "components/Input";
import Button from "components/Button";
// Utils
import { shortNameCapitalized } from "utils/format";
import dataUriToBlob from "utils/dataUriToBlob";
import { saveAs } from "file-saver";
import { stringSplit } from "utils/strings";
import { withToast } from "components/toast/Toast";

export function CopyFileFrom({
  containerName,
  fromPathDefault
}: {
  containerName: string;
  fromPathDefault?: string;
}) {
  const [fromPathInput, setFromPathInput] = useState("");

  const downloadFile = useCallback(
    async fromPath => {
      try {
        const name = shortNameCapitalized(containerName);
        const dataUri = await withToast(
          () => api.copyFileFrom({ containerName, fromPath }),
          {
            message: `Copying file from ${name} ${fromPath}...`,
            onSuccess: `Copied file from ${name} ${fromPath}`
          }
        );
        if (!dataUri) return;

        const blob = dataUriToBlob(dataUri);
        const fileName = parseFileName(fromPath, blob.type);

        saveAs(blob, fileName);
      } catch (e) {
        console.error(
          `Error on copyFileFrom ${containerName} ${fromPath}: ${e.stack}`
        );
      }
    },
    [containerName]
  );

  useEffect(() => {
    if (fromPathDefault) {
      setFromPathInput(fromPathDefault);
      downloadFile(fromPathDefault);
    }
  }, [fromPathDefault, downloadFile]);

  return (
    <div className="card-subgroup">
      {/* FROM, chose path */}
      <Input
        placeholder="Container from path"
        value={fromPathInput}
        onValueChange={setFromPathInput}
        onEnterPress={() => downloadFile(fromPathInput)}
        append={
          <Button
            onClick={() => downloadFile(fromPathInput)}
            disabled={!fromPathInput}
            variant="dappnode"
          >
            Download
          </Button>
        }
      />
    </div>
  );
}

function parseFileName(path: string, mimeType: string): string {
  if (!path || typeof path !== "string") return path;
  const subPaths = stringSplit(path, "/");
  let fileName = subPaths[subPaths.length - 1] || "";

  // Add extension in case it is a compressed directory
  if (
    mimeType === "application/gzip" &&
    !fileName.endsWith(".gzip") &&
    !fileName.endsWith(".gz")
  )
    fileName = `${fileName}.tar.gz`;

  return fileName;
}
