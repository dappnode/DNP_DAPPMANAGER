import React from "react";
import { Link } from "react-router-dom";
import { rootPath as installerRootPath } from "pages/installer";
// Components
import { ButtonLight } from "components/Button";

const NoPackagesYet = () => (
  <div className="centered-container">
    <h4>No installed DAppNode Packages yet</h4>
    <p>
      If you would like install a DAppNode package, go to the DAppStore tab.
    </p>
    <Link to={installerRootPath}>
      <ButtonLight>Go to DAppStore</ButtonLight>
    </Link>
  </div>
);

export default NoPackagesYet;
