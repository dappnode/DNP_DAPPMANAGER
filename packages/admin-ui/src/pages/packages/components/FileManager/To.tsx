import React, { useState, useEffect } from "react";
import { api } from "api";
// Components
import Input from "components/Input";
import Button from "components/Button";
// Utils
import fileToDataUri from "utils/fileToDataUri";
import humanFileSize from "utils/humanFileSize";
import { prettyFullName } from "utils/format";
import { withToast } from "components/toast/Toast";
import { PackageContainer } from "@dappnode/common";

const fileSizeWarning = 1e6;

export function CopyFileTo({
  container,
  toPathDefault
}: {
  container: PackageContainer;
  toPathDefault?: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [toPath, setToPath] = useState("");

  // File change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files ? e.target.files[0] : null;
    if (selectedFile) setFile(selectedFile);
  };

  useEffect(() => {
    if (toPathDefault) setToPath(toPathDefault);
  }, [toPathDefault]);

  // Updated file change handler

  async function uploadFile() {
    const prettyName = prettyFullName(container);
    if (file)
      try {
        const dataUri = await fileToDataUri(file);

        await withToast(
          () =>
            api.copyFileToDockerContainer({
              containerName: container.containerName,
              dataUri,
              filename: file.name,
              toPath
            }),
          {
            message: `Copying file ${file.name} to ${prettyName} ${toPath}...`,
            onSuccess: `Copied file ${file.name} to ${prettyName} ${toPath}`
          }
        );
      } catch (e) {
        console.error(
          `Error on copyFileTo ${prettyName} ${toPath}: ${e.stack}`
        );
      }
  }

  return (
    <div className="card-subgroup">
      {/* TO, choose source file */}
      <div className="input-group mb-3">
        <div className="custom-file">
          <input
            type="file"
            className="custom-file-input"
            onChange={handleFileChange}
          />
          <label className="custom-file-label" htmlFor="inputGroupFile01">
            {file
              ? `${file.name} (${humanFileSize(file.size || 0)})`
              : "Choose file"}
          </label>
        </div>
      </div>

      {file && file.name && file.size && file.size > fileSizeWarning && (
        <div className="alert alert-secondary">
          Note that this tool is not meant for large file transfers. Expect
          unstable behaviour.
        </div>
      )}

      {/* TO, choose destination path */}
      <Input
        placeholder="Defaults to $WORKDIR/"
        value={toPath}
        onValueChange={setToPath}
        onEnterPress={uploadFile}
        append={
          <Button onClick={uploadFile} disabled={!file} variant="dappnode">
            Upload
          </Button>
        }
      />
    </div>
  );
}
