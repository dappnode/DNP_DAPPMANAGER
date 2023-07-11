import React, { useEffect } from "react";
import { title, subPaths } from "../data";
import {
  Routes,
  Route,
  NavLink,
  useNavigate,
} from "react-router-dom";
// Components
import Title from "components/Title";
import AutoUpdates from "./AutoUpdates";
import Security from "./Security";
import PowerManagment from "./PowerManagment";
import SystemUpdate from "./SystemUpdate";
import Peers from "./Peers";
import Identity from "./Identity";
import SystemInfo from "./SystemInfo";
import Profile from "./Profile";
import { Network } from "./Network";
import { Advanced } from "./Advanced";
import { Notifications } from "./Notifications";
import Hardware from "./Hardware";
import { UsageContext } from "App";

const SystemRoot: React.FC = () => {
  const { usage } = React.useContext(UsageContext);
  const navigate = useNavigate();
  const basicRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
    hideFromMenu?: boolean;
  }[] = [
      {
        name: "Info",
        subPath: subPaths.info,
        component: SystemInfo
      },
      {
        name: "Auto updates",
        subPath: subPaths.autoUpdates,
        component: AutoUpdates
      },
      {
        name: "Profile",
        subPath: subPaths.profile,
        component: Profile
      },
      {
        name: "Power",
        subPath: subPaths.power,
        component: PowerManagment
      }
    ];
  const advancedRoutes: {
    name: string;
    subPath: string;
    component: React.ComponentType<any>;
    hideFromMenu?: boolean;
  }[] = [
      {
        name: "Notifications",
        subPath: subPaths.notifications,
        component: Notifications
      },
      {
        name: "Identity",
        subPath: subPaths.identity,
        component: Identity,
        hideFromMenu: true
      },

      {
        name: "Network",
        subPath: subPaths.network,
        component: Network
      },
      {
        name: "Update",
        subPath: subPaths.update,
        component: SystemUpdate
      },

      {
        name: "Peers",
        subPath: subPaths.peers,
        component: Peers
      },
      {
        name: "Security",
        subPath: subPaths.security,
        component: Security
      },
      {
        name: "Hardware",
        subPath: subPaths.hardware,
        component: Hardware
      },
      {
        name: "Advanced",
        subPath: subPaths.advanced,
        component: Advanced
      }
    ];

  const availableRoutes =
    usage === "advanced" ? [...basicRoutes, ...advancedRoutes] : basicRoutes;

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
        {availableRoutes
          .filter(route => !route.hideFromMenu)
          .map(route => (
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

export default SystemRoot;
