import { BiWrench } from "react-icons/bi";
import { IoMdSettings } from "react-icons/io";
import React from "react";
import "./dropdown.scss";
import { UsageContext } from "App";
import Tooltip from "react-bootstrap/Tooltip";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";

export default function UsageSwitch({
  toggleUsage
}: {
  toggleUsage: () => void;
}) {
  const { usage } = React.useContext(UsageContext);
  return (
    <div className="tn-dropdown">
      <OverlayTrigger
        placement={"bottom"}
        overlay={
          <Tooltip id={`tooltip-usage`}>
            Display {usage === "advanced" ? "basic usage" : "advanced usage"}
          </Tooltip>
        }
      >
        <button
          style={{ border: "none", background: "none" }}
          className="tn-dropdown-toggle"
          onClick={toggleUsage}
        >
          {usage === "advanced" ? (
            <BiWrench style={{ fontSize: "larger" }} />
          ) : (
            <IoMdSettings style={{ fontSize: "larger" }} />
          )}
        </button>
      </OverlayTrigger>
    </div>
  );
}
