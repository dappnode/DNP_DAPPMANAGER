import React, { useState } from "react";
import { useLocation } from "react-router-dom";
// Components
import Card from "components/Card";
import { CopyFileTo } from "./To";
import { CopyFileFrom } from "./From";
import { PackageContainer } from "common";
import { ServiceSelector } from "../ServiceSelector";

export const FileManager = ({
  containers
}: {
  containers: PackageContainer[];
}) => {
  const serviceNames = containers.map(c => c.serviceName);
  const [serviceName, setServiceName] = useState(serviceNames[0]);
  const location = useLocation();
  const { from, to } = fetchParamsFromExtraUrl(location.search);

  const container = containers.find(c => c.serviceName === serviceName);
  const containerName = container?.containerName;
  const name = serviceNames.length === 1 ? "package" : serviceName;

  return (
    <Card spacing divider className="file-manager">
      <ServiceSelector
        serviceName={serviceName}
        setServiceName={setServiceName}
        containers={containers}
      />

      {containerName && (
        <>
          <div>
            <div className="subtle-header">Upload file to {name}</div>
            <CopyFileTo containerName={containerName} toPathDefault={to} />
          </div>

          <div>
            <div className="subtle-header">Download file from {name}</div>
            <CopyFileFrom
              containerName={containerName}
              fromPathDefault={from}
            />
          </div>
        </>
      )}
    </Card>
  );
};

/**
 * Additional feature to auto-complete the from and to paths
 * Since it's not critical, errors are logged and ignored
 * @param searchQuery
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
