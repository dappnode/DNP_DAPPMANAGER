import React from "react";
// Components
import { title } from "../data";
import Title from "components/Title";
// Styles
import "./installer.scss";
import { InstallerNavigator } from "./InstallerNavigator";

const InstallerRoot: React.FC = () => {
  return (
    <>
      <Title title={title} />
      <InstallerNavigator />
    </>
  );
};

export default InstallerRoot;
