import React, { useEffect } from "react";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";
import { title } from "../data";
// Components
import AutoDiagnose from "./AutoDiagnose";
import Report from "./Report";
import Activity from "./Activity";
import Title from "components/Title";
// Styles
import "./support.scss";
import Ports from "./Ports";

const SupportRoot: React.FC = () => {
  const navigate = useNavigate();
  const routes = [
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

  // Redirect automatically to the first route. DO NOT hardcode
  // to prevent typos and causing infinite loops 
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    navigate(`${routes[0].subPath}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <>
      <Title title={title} />

      <div className="horizontal-navbar">
        {routes.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={route.subPath}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="packages-content">
        <Routes>
          {routes.map(route => (
            <Route
              key={route.subPath}
              path={route.subPath}
              element={<route.component />}
            />
          ))}
        </Routes>
      </div>
    </>
  );
};

export default SupportRoot;
