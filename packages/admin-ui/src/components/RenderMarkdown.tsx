import React from "react";
import ReactMarkdown from "react-markdown";
import "./renderMarkdown.scss";
import { joinCssClass } from "utils/css";

export default function RenderMarkdown({
  source,
  spacing,
  noMargin
}: {
  source: string;
  spacing?: boolean;
  noMargin?: boolean;
}) {
  return (
    <ReactMarkdown
      className={`markdown-render ${joinCssClass({ spacing, noMargin })}`}
      children={source}
      linkTarget={"_blank"}
    />
  );
}
