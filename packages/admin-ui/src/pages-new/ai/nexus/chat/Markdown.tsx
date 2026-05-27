import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "lib/utils";
import { Separator } from "components/primitives/separator";

interface MarkdownProps {
  content: string;
  className?: string;
}

/**
 * Renders chat assistant text as GitHub-flavoured Markdown styled with the
 * DAppNode design tokens. GFM gives us tables, strikethrough, and task
 * lists — without it the model's tables collapse into one paragraph.
 */
function MarkdownBase({ content, className }: MarkdownProps) {
  return (
    <div className={cn("tw:space-y-3", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="tw:leading-relaxed tw:text-foreground">{children}</p>
          ),
          h1: ({ children }) => (
            <h3 className="tw:mt-4 tw:text-base tw:font-semibold tw:text-foreground">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="tw:mt-4 tw:text-[15px] tw:font-semibold tw:text-foreground">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="tw:mt-3 tw:text-sm tw:font-semibold tw:text-foreground">{children}</h5>
          ),
          h4: ({ children }) => (
            <h6 className="tw:mt-3 tw:text-sm tw:font-medium tw:text-foreground">{children}</h6>
          ),
          ul: ({ children }) => (
            <ul className="tw:ml-5 tw:list-disc tw:space-y-1 marker:tw:text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="tw:ml-5 tw:list-decimal tw:space-y-1 marker:tw:text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="tw:leading-relaxed">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="tw:text-primary tw:underline tw:underline-offset-2 tw:hover:opacity-80"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="tw:font-semibold tw:text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="tw:italic">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="tw:border-l-2 tw:border-border tw:pl-3 tw:text-muted-foreground tw:italic">
              {children}
            </blockquote>
          ),
          hr: () => <Separator />,
          del: ({ children }) => <del className="tw:text-muted-foreground">{children}</del>,
          code: ({ inline, children }: React.PropsWithChildren<{ inline?: boolean }>) =>
            inline ? (
              <code className="tw:rounded tw:bg-muted tw:px-1.5 tw:py-0.5 tw:font-mono tw:text-[0.85em]">
                {children}
              </code>
            ) : (
              <code className="tw:block tw:font-mono tw:text-[0.85em] tw:leading-relaxed">
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="tw:overflow-x-auto tw:rounded-lg tw:border tw:border-border tw:bg-muted/60 tw:p-3">
              {children}
            </pre>
          ),
          // GFM tables — wrap in a horizontal scroll container so wide
          // tables don't blow out the chat width.
          table: ({ children }) => (
            <div className="tw:my-3 tw:overflow-x-auto tw:rounded-lg tw:border tw:border-border">
              <table className="tw:w-full tw:border-collapse tw:text-[12.5px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="tw:bg-muted/60 tw:text-[11.5px] tw:font-mono tw:uppercase tw:tracking-wide tw:text-muted-foreground">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="tw:border-b tw:border-border last:tw:border-b-0">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="tw:px-3 tw:py-2 tw:text-left tw:font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="tw:px-3 tw:py-2 tw:align-top tw:text-foreground">{children}</td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = React.memo(MarkdownBase);
