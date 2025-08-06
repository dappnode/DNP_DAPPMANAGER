import React from "react";
import { title } from "../data";
// Components
import AutoDiagnose from "./AutoDiagnose";
import Report from "./Report";
import Activity from "./Activity";
import Title from "components/Title";
import Ports from "./Ports";
import { SectionNavigator } from "components/SectionNavigator";
import { RouteType } from "types";
// Styles
import "./support.scss";

const SupportRoot: React.FC = () => {
  const availableRoutes: RouteType[] = [
    {
      name: "Auto Diagnose",
      subPath: "auto-diagnose",
      component: AutoDiagnose
    },
    {
      name: "Report",
      subPath: "report",
      component: Report
    },
    {
      name: "Ports",
      subPath: "ports",
      component: Ports
    },
    {
      name: "Activity",
      subPath: "activity",
      component: Activity
    }
  ];

  return (
    <>
      <Title title={title} />
      <SectionNavigator routes={availableRoutes} />
    </>
  );
};

export default SupportRoot;
