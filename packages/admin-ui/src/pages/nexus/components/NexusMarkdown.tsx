import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./nexusMarkdown.scss";

export default function NexusMarkdown({ source }: { source: string }) {
  return (
    <div className="nexus-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
