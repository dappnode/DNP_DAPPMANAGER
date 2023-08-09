import React from "react";
import Optimism from "./Optimism";
import Polygon from "./Polygon";
import Title from "components/Title";
import { NavLink, Routes, Route } from "react-router-dom";
import { title } from "../data";

const RollupsRoot: React.FC = () => {
  const rollupsItems: {
    subPath: string;
    title: string;
    component: () => React.JSX.Element;
  }[] = [
    {
      subPath: "optimism",
      title: "Optimism",
      component: () => Optimism()
    },
    {
      subPath: "polygon",
      title: "Polygon",
      component: () => Polygon()
    }
  ];

  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {rollupsItems.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={route.subPath}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.title}
            </NavLink>
          </button>
        ))}
      </div>

      <div className="section-spacing">
        <Routes>
          {rollupsItems.map(route => (
            <Route
              key={route.subPath}
              path={route.subPath}
              element={route.component()}
            />
          ))}
        </Routes>
      </div>
    </>
  );
};

export default RollupsRoot;
