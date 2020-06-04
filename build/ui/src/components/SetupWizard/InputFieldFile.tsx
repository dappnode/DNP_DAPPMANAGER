import React, { useState } from "react";
import humanFS from "utils/humanFileSize";

function addNameToDataURL(dataURL: string, name: string): string {
  return dataURL.replace(";base64", `;name=${encodeURIComponent(name)};base64`);
}

function fileToDataURL(files: FileList): Promise<string> {
  const file = files[0];
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = event => {
      if (event.target && event.target.result)
        resolve(addNameToDataURL(event.target.result.toString(), file.name));
    };
    reader.readAsDataURL(file);
  });
}

function dataURLtoFile(
  dataURL: string
): {
  name: string;
  size: number;
  type: string;
} {
  // Split metadata from data
  const splitted = dataURL.split(",");
  // Split params
  const params = splitted[0].split(";");
  // Get mime-type from params
  const type = params[0].replace("data:", "");
  // Filter the name property from params
  const properties = params.filter(param => {
    return param.split("=")[0] === "name";
  });
  // Look for the name and use unknown if no name property.
  let name;
  if (properties.length !== 1) {
    name = "unknown";
  } else {
    // Because we filtered out the other property,
    // we only have the name case here.
    name = properties[0].split("=")[1];
  }

  // Built the Uint8Array Blob parameter from the base64 string.
  const binary = atob(splitted[1]);
  const array = [];
  for (let i = 0; i < binary.length; i++) {
    array.push(binary.charCodeAt(i));
  }
  // Create the blob object
  const blob = new window.Blob([new Uint8Array(array)], { type });

  return {
    name: name,
    size: blob.size,
    type: blob.type
  };
}

export default function InputFieldFile({
  accept,
  value,
  onValueChange
}: {
  accept: string; // ".tar, .xz, .tar.xz, .zip"
  value: string;
  onValueChange: (newValue: string) => void;
}) {
  const [processing, setProcessing] = useState(false);
  async function onSelectFile(files: FileList) {
    try {
      setProcessing(true);
      const dataURL = await fileToDataURL(files);
      onValueChange(dataURL);
    } catch (e) {
      console.log(`Error processing file: ${e.stack}`);
    } finally {
      setProcessing(false);
    }
  }

  const file = value ? dataURLtoFile(value) : null;

  return (
    <div className="custom-file">
      <input
        type="file"
        className="custom-file-input"
        accept={accept}
        onChange={e => {
          if (e.target.files) onSelectFile(e.target.files);
        }}
        disabled={processing}
      />
      <label className="custom-file-label" htmlFor="inputGroupFile01">
        {processing
          ? "Loading file..."
          : file
          ? `${decodeURIComponent(file.name)} - ${humanFS(file.size)}`
          : "Choose file"}
      </label>
    </div>
  );
}
