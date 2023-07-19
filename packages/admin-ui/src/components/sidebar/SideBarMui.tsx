import * as React from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import { UsageContext } from "../../App";

import "./sidebar.scss";
import logoWide from "img/dappnode-logo-wide-min.png";
import logomin from "img/dappnode-logo-only.png";
import logoWideDark from "img/dappnode-logo-wide-min-dark.png";

import { advancedItems, basicItems, fundedBy } from "./navbarItems";
import { NavLink } from "react-router-dom";

const NavItem = styled(NavLink)(({ theme }) => {
  return {
    color: "black",
    textDecoration: "none",
    transition: "all 0.5s",
    fontSize: "0.94rem",
    "& .subheader": {
      fontSize: "80%",
      opacity: 0.6
    },
    "&.selectable": {
      cursor: "pointer",
      transition: "background 150ms ease, color 150ms ease, border 150ms ease",
      "&:hover, &.active": {
        borderLeft: "5px solid var(--dappnode-strong-main-color)",
        color: "black",
        fontWeight: 800,
        textDecoration: "none",
        backgroundColor: "#e6eceb80",
        "& svg": {
          opacity: 0.7
        }
      },
      "& svg": {
        fontSize: "1.5rem"
      }
    },
    [theme.breakpoints.down("sm")]: {
      display: "flex",
      justifyContent: "center"
    }
  };
});

const Sidebar = styled(Box)({
  display: "flex",
  flexDirection: "column",
  "& .spacer": {
    flex: "auto"
  }
});

if (!Array.isArray(advancedItems))
  throw Error("advancedItems must be an array");
if (!Array.isArray(basicItems)) throw Error("basicItems must be an array");
if (!Array.isArray(fundedBy)) throw Error("fundedBy must be an array");

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  }),
  overflowX: "hidden"
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`
  }
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: prop => prop !== "open"
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme)
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme)
  })
}));

export default function SideBar({ screenWidth }: { screenWidth: number }) {
  const { usage } = React.useContext(UsageContext);
  const sidenavItems =
    usage === "advanced" ? [...basicItems, ...advancedItems] : basicItems;

  return (
    <Sidebar sx={{ display: "flex" }}>
      <CssBaseline />
      <Drawer variant="permanent" open={screenWidth > 640}>
        <Box
          component="img"
          src={screenWidth > 640 ? logoWide : logomin}
          alt="logo"
          sx={{
            cursor: "pointer",
            width: "70%", // adjust size to fit your needs
            margin: "10px auto" // adds margins and centers image horizontally
          }}
        />
        <Divider />
        <List>
          {sidenavItems.map(item => (
            <NavItem
              key={item.name}
              className="sidenav-item selectable"
              to={item.href}
            >
              <item.icon />
              {/* 640 px = 40 rem */}
              {screenWidth > 640 && (
                <span className="name svg-text">{item.name}</span>
              )}
            </NavItem>
          ))}
        </List>
      </Drawer>
    </Sidebar>
  );
}
