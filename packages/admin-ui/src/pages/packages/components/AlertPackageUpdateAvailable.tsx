import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInstallerPath } from "pages/installer";
import Alert from "react-bootstrap/esm/Alert";
import Button from "components/Button";
import { prettyDnpName } from "utils/format";
import { UpdateAvailable } from "@dappnode/types";

export function AlertPackageUpdateAvailable({
  dnpName,
  updateAvailable
}: {
  dnpName: string;
  updateAvailable: UpdateAvailable;
}) {
  const [show, setShow] = useState(true);
  const navigate = useNavigate();
  return show ? (
    <Alert variant="info" onClose={() => setShow(false)} dismissible className="main-notification">
      <div>
        {prettyDnpName(dnpName)} update available to version {updateAvailable.newVersion}{" "}
        {updateAvailable.upstreamVersion && `(${updateAvailable.upstreamVersion} upstream)`}
      </div>
      <Button onClick={() => navigate(`${getInstallerPath(dnpName)}/${dnpName}`)} variant="dappnode">
        Update
      </Button>
    </Alert>
  ) : null;
}
