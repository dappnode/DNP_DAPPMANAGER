import React from "react";
import ReactMarkdown from "react-markdown";
import "./renderMarkdown.scss";
import { joinCssClass } from "utils/css";

function ParagraphRenderer(props: any) {
  const { children } = props;

  if (
    children &&
    children[0] &&
    children.length === 1 &&
    children[0].props &&
    children[0].props.src
  ) {
    // rendering media without p wrapper

    return children;
  }

  return <p>{children}</p>;
}

function LinkRenderer(props: any) {
  return (
    <a href={props.href} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  );
}

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
      source={source}
      renderers={{
        link: LinkRenderer,
        paragraph: ParagraphRenderer
      }}
    />
  );
}
