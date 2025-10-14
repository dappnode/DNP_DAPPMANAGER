import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import { api } from "api";
// Components
import Input from "components/Input";
import Button from "components/Button";
// Utils
import fileToDataUri from "utils/fileToDataUri";
import humanFileSize from "utils/humanFileSize";
import { prettyFullName } from "utils/format";
import { withToast } from "components/toast/Toast";
import { PackageContainer } from "@dappnode/types";

const fileSizeWarning = 1e6;

export function CopyFileTo({ container, toPathDefault }: { container: PackageContainer; toPathDefault?: string }) {
  const [file, setFile] = useState<File>();
  const [toPath, setToPath] = useState("");

  useEffect(() => {
    if (toPathDefault) setToPath(toPathDefault);
  }, [toPathDefault]);

  const { name, size } = file || {};

  async function uploadFile() {
    const prettyName = prettyFullName(container);
    if (file)
      try {
        const dataUri = await fileToDataUri(file);
        const filename = name || "";

        await withToast(
          () =>
            api.copyFileToDockerContainer({
              containerName: container.containerName,
              dataUri,
              filename: name || "",
              toPath
            }),
          {
            message: `Copying file ${filename} to ${prettyName} ${toPath}...`,
            onSuccess: `Copied file ${filename} to ${prettyName} ${toPath}`
          }
        );
      } catch (e) {
        console.error(`Error on copyFileTo ${prettyName} ${toPath}: ${e.stack}`);
      }
  }

  return (
    <div className="card-subgroup">
      {/* TO, choose source file */}
      <div className="input-group mb-3">
        <Form.Control
          type="file"
          className="custom-file-input"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            if (e && e.target && e.target.files && e.target.files[0]) setFile(e.target.files[0]);
          }}
        />
        <Form.Label className="custom-file-label">{name && `(${humanFileSize(size || 0)})`}</Form.Label>
      </div>

      {name && size && size > fileSizeWarning && (
        <div className="alert alert-secondary">
          Note that this tool is not meant for large file transfers. Expect unstable behaviour.
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
