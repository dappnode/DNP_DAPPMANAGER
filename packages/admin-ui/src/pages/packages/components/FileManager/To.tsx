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
import { PackageContainer } from "@dappnode/types";

// Constants
const fileSizeWarning = 1e6; // 1MB

interface CopyFileToProps {
  container: PackageContainer;
  toPathDefault?: string;
}

export const CopyFileTo: React.FC<CopyFileToProps> = ({ container, toPathDefault = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [toPath, setToPath] = useState(toPathDefault);
  const [inputKey, setInputKey] = useState<number>(0); // Key to force re-render
  const [fileName, setFileName] = useState<string>('Choose file'); // State to manage file name for label

  useEffect(() => {
    setToPath(toPathDefault);
  }, [toPathDefault]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setInputKey(prevKey => prevKey + 1); // Increment the key to force re-render

    console.log('selectedFile:', selectedFile);
    // Update the label with the file name or reset if no file is selected
    setFileName(selectedFile ? `${selectedFile.name} (${humanFileSize(selectedFile.size)})` : 'Choose file');
  };

  useEffect(() => {
    console.log("rerendering")
    console.log("file", file)
  }
  , []);
  const uploadFile = async () => {
    if (!file) return;

    try {
      const dataUri = await fileToDataUri(file);
      const filename = file.name;
      await withToast(
        () => api.copyFileToDockerContainer({
          containerName: container.containerName,
          dataUri,
          filename,
          toPath,
        }),
        {
          message: `Copying file ${filename} to ${prettyFullName(container)} ${toPath}...`,
          onSuccess: `Copied file ${filename} to ${prettyFullName(container)} ${toPath}`,
        }
      );
    } catch (e) {
      console.error(`Error copying file to ${prettyFullName(container)} ${toPath}:`, e);
    }
  };

  return (
<div className="card-subgroup">
      <div className="input-group mb-3">
        <div className="custom-file">
          <input
            key={inputKey}
            type="file"
            className="custom-file-input"
            onChange={handleFileChange}
          />
          <label className="custom-file-label" htmlFor="inputGroupFile01">
            {fileName}
          </label>
        </div>
      </div>

      {file && file.size > fileSizeWarning && (
        <div className="alert alert-secondary">
          Note that this tool is not meant for large file transfers. Expect unstable behaviour.
        </div>
      )}
      <Input
        placeholder="Defaults to $WORKDIR/"
        value={toPath}
        onValueChange={setToPath}
        onEnterPress={uploadFile}
        append={<Button onClick={uploadFile} disabled={!file} variant="dappnode">Upload</Button>}
      />
    </div>
  );
};
