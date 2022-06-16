import { BsMoon } from "react-icons/bs";
import { FaSun } from "react-icons/fa";
import React from "react";
import "./dropdown.scss";
import { ThemeContext } from "App";

export default function ThemeSwitch({
  toggleTheme
}: {
  toggleTheme: () => void;
}) {
  // get context provider
  const { theme } = React.useContext(ThemeContext);
  return (
    <div className="tn-dropdown">
      <button
        style={{ border: "none", background: "none" }}
        className="tn-dropdown-toggle"
        onClick={toggleTheme}
      >
        {theme === "light" ? (
          <BsMoon style={{ fontSize: "larger" }} />
        ) : (
          <FaSun style={{ fontSize: "larger" }} />
        )}
      </button>
    </div>
  );
}
