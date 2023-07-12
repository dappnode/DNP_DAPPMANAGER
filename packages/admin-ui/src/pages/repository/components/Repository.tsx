import React, { useEffect } from "react";
import Eth from "./Eth";
import Ipfs from "./Ipfs";
import {
  NavLink,
  useNavigate,
  Route,
  Routes
} from "react-router-dom";
import { subPaths, title } from "../data";
import Title from "components/Title";

export const Repository: React.FC = () => {
  const navigate = useNavigate();
  const availableRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
  }[] = [
      {
        name: "Ethereum",
        subPath: subPaths.eth,
        component: Eth
      },
      {
        name: "IPFS",
        subPath: subPaths.ipfs,
        component: Ipfs
      }
    ];


  // Redirect automatically to the first route. DO NOT hardcode
  // to prevent typos and causing infinite loops 
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    navigate(`${availableRoutes[0].subPath}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map(route => (
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

      <div className="section-spacing">
        <Routes>
          {availableRoutes.map(route => (
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
