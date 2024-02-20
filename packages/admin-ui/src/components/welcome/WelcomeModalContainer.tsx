import React, { useState, useEffect } from "react";
import { joinCssClass } from "utils/css";
import "./welcome.scss";
import { AiOutlineClose } from "react-icons/ai";

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
const WelcomeModalContainer: React.FC<{
  children?: React.ReactNode;
  show: boolean;
  onClose: () => void;
}> = ({ show, children, onClose }) => {
  const [status, setStatus] = useState<FadeStatus>("null");

  useEffect(() => {
    let timeout: unknown;
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
      clearTimeout(timeout as number);
    };
  }, [show, status]);

  if (!children || status === "null") return null;
  return (
    <div className={joinCssClass("welcome-container", status)}>
      <div className="welcome">
        <button className="close-button" onClick={onClose}>
          <AiOutlineClose className="close-icon" />
        </button>
        {children}
      </div>
    </div>
  );
};

export default WelcomeModalContainer;
