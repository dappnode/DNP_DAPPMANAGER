import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
// Own module
import { title, subPaths } from "../data";
// Components
import Title from "components/Title";
import Inbox from "./tabs/Inbox";
// CSS
import "./notifications.scss";
import { useApi } from "api";

export const NotificationsRoot: React.FC = () => {
  const availableRoutes: {
    name: string;
    subPath: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: () => React.JSX.Element;
  }[] = [
    {
      name: "Inbox",
      subPath: subPaths.inbox,
      component: Inbox
    },
    {
      name: "Settings",
      subPath: subPaths.settings,
      component: Inbox
    }
  ];

  

    const dnpsRequest = useApi.packagesGet();
    console.log('dnpsRequest', dnpsRequest);
    
  
  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map((route) => (
          <button key={route.subPath} className="item-container">
            <NavLink to={route.subPath} className="item no-a-style" style={{ whiteSpace: "nowrap" }}>
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Routes>
          {availableRoutes.map((route) => (
            <Route key={route.subPath} path={route.subPath} element={<route.component />} />
          ))}
        </Routes>
      </div>
    </>
  );
};
