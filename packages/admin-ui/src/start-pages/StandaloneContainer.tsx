import React from "react";
import logo from "img/dappnode-logo-wide-min.png";
import { IconType } from "react-icons/lib";
import "./standaloneContainer.scss";

export const StandaloneContainer: React.FC<{
  TopIcon: IconType;
  title: string;
  children: React.ReactNode;
}> = ({ TopIcon, title, children }) => (
  <div className="standalone-container">
    <div className="toplogo">
      <TopIcon />
    </div>

    <div className="title">{title}</div>

    {children}

    <div className="separator" />
    <img className="logo" src={logo} alt="logo" />
  </div>
);
