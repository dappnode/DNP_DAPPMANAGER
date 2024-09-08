import { BsMoon } from "react-icons/bs";
import { FaSun } from "react-icons/fa";
import React from "react";
import "./dropdown.scss";
import { AppContext } from "App";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

export default function ThemeSwitch({ toggleTheme }: { toggleTheme: () => void }) {
  const { theme } = React.useContext(AppContext);
  return (
    <div className="tn-dropdown">
      <OverlayTrigger
        placement={"bottom"}
        overlay={<Tooltip id={`tooltip-theme`}>Display {theme === "light" ? "dark mode" : "light mode"}</Tooltip>}
      >
        <button style={{ border: "none", background: "none" }} className="tn-dropdown-toggle" onClick={toggleTheme}>
          {theme === "light" ? <BsMoon style={{ fontSize: "larger" }} /> : <FaSun style={{ fontSize: "larger" }} />}
        </button>
      </OverlayTrigger>
    </div>
  );
}
