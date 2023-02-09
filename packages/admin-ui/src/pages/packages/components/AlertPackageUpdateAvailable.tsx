import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { rootPath as installerRootPath } from "pages/installer";
import Alert from "react-bootstrap/esm/Alert";
import Button from "components/Button";
import { prettyDnpName } from "utils/format";
import { urlJoin } from "utils/url";
import { UpdateAvailable } from "@dappnode/common";

export function AlertPackageUpdateAvailable({
  dnpName,
  updateAvailable
}: {
  dnpName: string;
  updateAvailable: UpdateAvailable;
}) {
  const [show, setShow] = useState(true);
  return show ? (
    <Alert
      variant="info"
      onClose={() => setShow(false)}
      dismissible
      className="main-notification"
    >
      <div>
        {prettyDnpName(dnpName)} update available to version{" "}
        {updateAvailable.newVersion}{" "}
        {updateAvailable.upstreamVersion &&
          `(${updateAvailable.upstreamVersion} upstream)`}
      </div>
      <NavLink to={urlJoin(installerRootPath, dnpName)}>
        <Button variant="dappnode">Update</Button>
      </NavLink>
    </Alert>
  ) : null;
}
