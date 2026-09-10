import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./nexusMarkdown.scss";

export default function NexusMarkdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      className="nexus-markdown"
      remarkPlugins={[remarkGfm]}
      linkTarget="_blank"
    >
      {source}
    </ReactMarkdown>
  );
}
