import React from "react";
import { useNavigate } from "react-router-dom";
// Components
import Button from "components/Button";
// Modules
import {
  relativePath as installedRelativePath,
  getInstallerPath
} from "pages/installer";
// Utils
import { prettyDnpName } from "utils/format";

export const NoDnpInstalled = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  return (
    <div className="centered-container">
      <h4>{id} is not installed</h4>
      <p>Go back to packages or click below to install it</p>
      <Button
        onClick={() => navigate("/" + installedRelativePath)}
        style={{ textTransform: "capitalize" }}
      >
        Packages
      </Button>
      <Button onClick={() => navigate(getInstallerPath(id) + "/" + id)}>
        Install {prettyDnpName(id)}
      </Button>
    </div>
  );
};
