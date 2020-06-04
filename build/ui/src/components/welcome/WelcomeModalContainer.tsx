import React, { useState, useEffect } from "react";
import { joinCssClass } from "utils/css";
import "./welcome.scss";

// Matches the value in welcome.scss
const transitionMs = 300;

/**
 * Track the internal status of the opacity of the welcome container
 */
type FadeStatus = "null" | "opacity-0" | "opacity-1";

/**
 * Welcome modal overlay container
 * Does a simple fade in/out animation. This component can appear abruptly
 * so the animation is important to soften it's flashy behaviour
 */
const WelcomeModalContainer: React.FunctionComponent<{
  show: boolean;
}> = ({ show, children }) => {
  const [status, setStatus] = useState<FadeStatus>("null");

  useEffect(() => {
    let timeout: number;
    if (show) {
      if (status === "null") setStatus("opacity-0");
      if (status === "opacity-0")
        timeout = setTimeout(() => setStatus("opacity-1"), transitionMs / 2);
    } else {
      if (status === "opacity-1") setStatus("opacity-0");
      if (status === "opacity-0")
        timeout = setTimeout(() => setStatus("null"), transitionMs);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [show, status]);

  if (!children || status === "null") return null;
  return (
    <div className={joinCssClass("welcome-container", status)}>
      <div className="welcome">{children}</div>
    </div>
  );
};

export default WelcomeModalContainer;
