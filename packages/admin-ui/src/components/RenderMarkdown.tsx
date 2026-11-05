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
    <div className={`markdown-render ${joinCssClass({ spacing, noMargin })}`}>
      <ReactMarkdown
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
