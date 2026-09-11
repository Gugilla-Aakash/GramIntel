"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

const DELIMITER = /\|(?:\s*:?-+:?\s*\|)+/;

function repairCollapsedTables(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      DELIMITER.test(line) ? line.replace(/\|[ \t]+(?=\|)/g, "|\n") : line
    )
    .join("\n");
}

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="gi-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {repairCollapsedTables(children)}
      </ReactMarkdown>
    </div>
  );
}
