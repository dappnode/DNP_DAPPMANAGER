import React from "react";
import newTabProps from "utils/newTabProps";
import { FaReadme } from "react-icons/fa";

export default function LinkDocs({
  urlDocs,
  text
}: {
  urlDocs: string;
  text?: string;
}) {
  return (
    <a style={{ display: "inLine" }} href={urlDocs} {...newTabProps}>
      <FaReadme className="links-icon" />
      {text || urlDocs}
    </a>
  );
}
