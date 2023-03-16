import { GrUserSettings } from "react-icons/gr";
import { GrUserExpert } from "react-icons/gr";
import React from "react";
import "./dropdown.scss";
import { UsageContext } from "App";

export default function ThemeSwitch({
  toggleTheme
}: {
  toggleTheme: () => void;
}) {
  // get context provider
  const { usage } = React.useContext(UsageContext);
  return (
    <div className="tn-dropdown">
      <button
        style={{ border: "none", background: "none" }}
        className="tn-dropdown-toggle"
        onClick={toggleTheme}
      >
        {usage === "advanced" ? (
          <GrUserSettings style={{ fontSize: "larger" }} />
        ) : (
          <GrUserExpert style={{ fontSize: "larger" }} />
        )}
      </button>
    </div>
  );
}
