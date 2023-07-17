import React from "react";
import { Link } from "react-router-dom";
import { relativePath as installedRelativePath } from "pages/installer";
// Components
import Button from "components/Button";

export const NoPackagesYet = () => (
  <div className="centered-container">
    <h4>No installed DAppNode Packages yet</h4>
    <p>
      If you would like install a DAppNode package, go to the DAppStore tab.
    </p>
    <Link to={installedRelativePath}>
      <Button>Go to DAppStore</Button>
    </Link>
  </div>
);
