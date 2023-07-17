import React from "react";
import { Link } from "react-router-dom";
// Components
import Button from "components/Button";
// Modules
import { relativePath as installedRelativePath } from "pages/installer";
import { rootPath as packagesRootPath } from "pages/packages";
// Utils
import { prettyDnpName } from "utils/format";

export const NoDnpInstalled = ({ id }: { id: string }) => (
  <div className="centered-container">
    <h4>{id} is not installed</h4>
    <p>Go back to packages or click below to install it</p>
    <Link style={{ margin: "0 10px" }} to={packagesRootPath}>
      <Button style={{ textTransform: "capitalize" }}>Packages</Button>
    </Link>
    <Link style={{ margin: "0 10px" }} to={installedRelativePath + "/" + id}>
      <Button>Install {prettyDnpName(id)}</Button>
    </Link>
  </div>
);
