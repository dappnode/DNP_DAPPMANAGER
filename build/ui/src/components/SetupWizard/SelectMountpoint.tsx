import React, { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { api } from "api";
import Dropdown from "react-bootstrap/Dropdown";
import ProgressBar from "react-bootstrap/ProgressBar";
import Button from "components/Button";
import { prettyBytes } from "utils/format";
import { MdHome, MdRefresh } from "react-icons/md";
import { joinCssClass } from "utils/css";
import { MountpointData } from "types";
import newTabProps from "utils/newTabProps";
import "./selectMountpoint.scss";

export const selectMountpointId = "selectMountpoint";
const troubleshootUrl =
  "https://github.com/dappnode/DAppNode/wiki/Troubleshoot-mountpoints";

function renderMountpointDataSummary({
  mountpoint,
  vendor,
  total,
  model
}: {
  mountpoint: string;
  vendor: string;
  total: number;
  model: string;
}) {
  const totalView = Boolean(total) && <span>{prettyBytes(total)}</span>;
  if (!mountpoint)
    return (
      <>
        <span>Host</span>
        {totalView}
        <small>(default)</small>
      </>
    );
  if (!vendor && !model)
    return (
      <>
        <span>{mountpoint}</span>
        {totalView}
      </>
    );
  return (
    <>
      <span>{vendor || model}</span>
      {totalView}
      <small>{model}</small>
    </>
  );
}

export function MountpointDataView({
  fileSystem
}: {
  fileSystem: MountpointData;
}) {
  const { mountpoint, vendor, model, total, use, free } = fileSystem;
  const isHost = !mountpoint;
  const showFree = Boolean(free) || mountpoint;
  return (
    <div className="mountpoint-view">
      <div className="info top">
        {isHost && (
          <span className="host">
            <MdHome />
          </span>
        )}
        {renderMountpointDataSummary({ mountpoint, vendor, model, total })}
      </div>
      <div className="info bottom">
        <ProgressBar className="use" now={parseInt(use)} label={use} />
        {showFree && <span className="free">{prettyBytes(free)}</span>}
        <span className="mountpoint">{mountpoint}</span>
      </div>
    </div>
  );
}

export default function SelectMountpoint({
  // React JSON form data props
  value,
  onValueChange,
  options
}: {
  value: string;
  onValueChange: (value: string) => void;
  options?: {
    alreadySet?: boolean;
    isLegacy?: boolean;
    prevPath?: string;
  };
}) {
  const mountpointsGetKey = "mountpointsGet";
  const { data: mountpointsApi, error, isValidating } = useSWR(
    [mountpointsGetKey],
    () => api.mountpointsGet()
  );

  const [showHelp, setShowHelp] = useState(false);

  const mountpointsLoaded = Boolean(mountpointsApi);
  const mountpoints: MountpointData[] = mountpointsApi || [
    {
      mountpoint: "",
      vendor: "Host",
      model: "(default)",
      use: "",
      used: 0,
      total: 0,
      free: 0
    }
  ];

  const { alreadySet, isLegacy, prevPath } = options || {};
  const selectedMountpoint = mountpoints.find(
    ({ mountpoint }) => mountpoint === value
  );

  // If the user has selected an invalid mountpoint and is not loading or already set,
  // reset the value to the host (default) to prevent problems
  useEffect(() => {
    if (value && !selectedMountpoint && !alreadySet && !isValidating)
      onValueChange("");
  }, [value, selectedMountpoint, alreadySet, isValidating, onValueChange]);

  async function onSelectMountpoint(mountpoint: string) {
    if (isLegacy || alreadySet) return;
    onValueChange(mountpoint);
  }

  return (
    <>
      <div
        className="display-mountpoints"
        onClick={alreadySet && !showHelp ? () => setShowHelp(true) : undefined}
      >
        <Dropdown drop="down" id="select-mountpoint">
          <Dropdown.Toggle
            variant="outline-secondary"
            id="dropdown-basic"
            disabled={alreadySet}
            className="mountpoint-view"
          >
            <div className="info top">
              {isLegacy ? (
                <>
                  <span>{prevPath}</span>
                  <small>(legacy)</small>
                </>
              ) : selectedMountpoint ? (
                renderMountpointDataSummary(selectedMountpoint)
              ) : alreadySet ? (
                <>
                  <span>{prevPath}</span>
                  <small>(unknown device)</small>
                </>
              ) : isValidating ? (
                <span>Loading...</span>
              ) : (
                <span>Select drive</span>
              )}
            </div>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            {mountpoints.map(fileSystem => (
              <Dropdown.Item
                key={fileSystem.mountpoint}
                onClick={() => {
                  onSelectMountpoint(fileSystem.mountpoint);
                }}
              >
                <MountpointDataView fileSystem={fileSystem} />
              </Dropdown.Item>
            ))}

            {isValidating && !mountpointsLoaded && (
              <Dropdown.Item>Loading...</Dropdown.Item>
            )}

            <Dropdown.Item
              href={troubleshootUrl}
              {...newTabProps}
              className="troubleshoot"
            >
              Not seeing your drive? Click here
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        {!alreadySet && (
          <Button
            // Manually trigger re-fetching of SWR
            onClick={() => mutate(mountpointsGetKey)}
            disabled={isValidating}
            className={"refresh " + joinCssClass({ loading: isValidating })}
          >
            <MdRefresh />
            <span className="text">Refresh</span>
          </Button>
        )}
      </div>

      {showHelp && (
        <div className="change-mountpoint-help">
          Existing volumes can't be changed. To do so, unistall this package and
          remove its data
        </div>
      )}

      {error && (
        <div className="change-mountpoint-error">
          Error detecting mountpoints: {error}
        </div>
      )}
    </>
  );
}
