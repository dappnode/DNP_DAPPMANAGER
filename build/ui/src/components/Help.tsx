import React from "react";
import { NavLink } from "react-router-dom";
import { MdHelpOutline } from "react-icons/md";
import newTabProps from "utils/newTabProps";

export function HelpTo({ url }: { url: string }) {
  if (url.includes("://"))
    return (
      <a className="help" href={url} {...newTabProps}>
        <MdHelpOutline />
      </a>
    );
  else
    return (
      <NavLink className="help" to={url}>
        <MdHelpOutline />
      </NavLink>
    );
}
