import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { api, apiRoutes } from "api";
import { toast } from "sonner";
import { PackageContainer } from "@dappnode/types";
import { prettyFullName } from "utils/format";
import fileToDataUri from "utils/fileToDataUri";
import humanFileSize from "utils/humanFileSize";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "components/primitives/card";
import { Button } from "components/primitives/button";
import { Input } from "components/primitives/input";
import { Label } from "components/primitives/label";
import { Alert, AlertDescription } from "components/primitives/alert";
import { ServiceSelector } from "../components/ServiceSelector";
import { Upload, Download, TriangleAlert } from "lucide-react";

const FILE_SIZE_WARNING = 1e6; // 1 MB

export function FileManagerTab({ containers }: { containers: PackageContainer[] }) {
  const serviceNames = containers.map((c) => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const location = useLocation();
  const { from, to } = parseSearchParams(location.search);
  const container = containers.find((c) => c.serviceName === serviceName);

  return (
    <div className="tw:flex tw:flex-col tw:gap-6">
      {/* Service selector */}
      {serviceNames.length > 1 && (
        <ServiceSelector serviceName={serviceName} setServiceName={setServiceName} containers={containers} />
      )}

      {container && (
        <>
          <UploadCard container={container} toPathDefault={to} />
          <DownloadCard container={container} fromPathDefault={from} />
        </>
      )}
    </div>
  );
}

/* ── Upload (Copy To) ───────────────────────────────────────────────── */

function UploadCard({ container, toPathDefault }: { container: PackageContainer; toPathDefault?: string }) {
  const [file, setFile] = useState<File>();
  const [toPath, setToPath] = useState("");

  useEffect(() => {
    if (toPathDefault) setToPath(toPathDefault);
  }, [toPathDefault]);

  async function handleUpload() {
    if (!file) return;
    const prettyName = prettyFullName(container);
    try {
      toast.loading(`Uploading ${file.name} to ${prettyName}…`, { id: "file-upload" });
      const dataUri = await fileToDataUri(file);
      await api.copyFileToDockerContainer({
        containerName: container.containerName,
        dataUri,
        filename: file.name || "",
        toPath
      });
      toast.success(`Uploaded ${file.name} to ${prettyName} ${toPath}`, { id: "file-upload" });
    } catch (e) {
      toast.error(`Upload failed: ${e}`, { id: "file-upload" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <Upload className="tw:size-4" />
          Upload File
        </CardTitle>
        <CardDescription>Upload a file from your computer to the container.</CardDescription>
      </CardHeader>
      <CardContent className="tw:flex tw:flex-col tw:gap-4">
        {/* File picker */}
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <Label>Source file</Label>
          <Input
            type="file"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          {file && (
            <p className="tw:text-xs tw:text-muted-foreground">
              {file.name} ({humanFileSize(file.size)})
            </p>
          )}
        </div>

        {file && file.size > FILE_SIZE_WARNING && (
          <Alert>
            <TriangleAlert className="tw:size-4" />
            <AlertDescription>
              This tool is not meant for large file transfers. Expect unstable behaviour for files over 1 MB.
            </AlertDescription>
          </Alert>
        )}

        {/* Destination path */}
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <Label>Destination path</Label>
          <div className="tw:flex tw:gap-2">
            <Input
              placeholder="Defaults to $WORKDIR/"
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpload()}
              className="tw:flex-1"
            />
            <Button onClick={handleUpload} disabled={!file}>
              <Upload className="tw:size-3.5 tw:mr-1.5" />
              Upload
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Download (Copy From) ───────────────────────────────────────────── */

function DownloadCard({ container, fromPathDefault }: { container: PackageContainer; fromPathDefault?: string }) {
  const [fromPath, setFromPath] = useState("");

  const getUrl = useCallback(
    (path: string) => apiRoutes.fileDownloadUrl({ containerName: container.containerName, path }),
    [container.containerName]
  );

  const downloadFile = useCallback((path: string) => window.open(getUrl(path), "_newtab"), [getUrl]);

  useEffect(() => {
    if (fromPathDefault) {
      setFromPath(fromPathDefault);
      downloadFile(fromPathDefault);
    }
  }, [fromPathDefault, downloadFile]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="tw:flex tw:items-center tw:gap-2">
          <Download className="tw:size-4" />
          Download File
        </CardTitle>
        <CardDescription>Download a file from the container to your computer.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="tw:flex tw:flex-col tw:gap-1.5">
          <Label>Container path</Label>
          <div className="tw:flex tw:gap-2">
            <Input
              placeholder="/path/to/file"
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && downloadFile(fromPath)}
              className="tw:flex-1"
            />
            <a href={getUrl(fromPath)} target="_blank" rel="noopener noreferrer">
              <Button disabled={!fromPath}>
                <Download className="tw:size-3.5 tw:mr-1.5" />
                Download
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Helpers ────────────────────────────────────────────────────────── */

function parseSearchParams(searchQuery: string): { from?: string; to?: string } {
  try {
    if (!searchQuery) return {};
    const sp = new URLSearchParams(searchQuery);
    return {
      from: sp.get("from") || undefined,
      to: sp.get("to") || undefined
    };
  } catch {
    return {};
  }
}
