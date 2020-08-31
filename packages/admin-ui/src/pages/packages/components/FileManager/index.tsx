import React, { useState } from "react";
import { useLocation } from "react-router-dom";
// Components
import Card from "components/Card";
import Select from "components/Select";
import { CopyFileTo } from "./To";
import { CopyFileFrom } from "./From";
import { PackageContainer } from "common";

export const FileManager = ({
  containers
}: {
  containers: PackageContainer[];
}) => {
  const containerNames = containers.map(c => c.containerName);
  const [containerName, setContainerName] = useState(containerNames[0]);
  const location = useLocation();
  const { from, to } = fetchParamsFromExtraUrl(location.search);

  return (
    <Card spacing divider className="file-manager">
      {containerNames.length > 1 && (
        <Select
          value={containerName}
          onValueChange={setContainerName}
          options={containerNames}
        />
      )}

      <div>
        <div className="subtle-header">Upload file to package</div>
        <CopyFileTo containerName={containerName} toPathDefault={to} />
      </div>

      <div>
        <div className="subtle-header">Download file from package</div>
        <CopyFileFrom containerName={containerName} fromPathDefault={from} />
      </div>
    </Card>
  );
};

/**
 * Additional feature to auto-complete the from and to paths
 * Since it's not critical, errors are logged and ignored
 * @param {string} searchQuery
 */
function fetchParamsFromExtraUrl(
  searchQuery: string
): {
  from?: string;
  to?: string;
} {
  try {
    if (!searchQuery) return {};
    const searchParams = new URLSearchParams(searchQuery);
    if (!searchParams) return {};
    return {
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined
    };
  } catch (e) {
    console.error(`Error parsing extra URL: ${e.stack}`);
    return {};
  }
}
