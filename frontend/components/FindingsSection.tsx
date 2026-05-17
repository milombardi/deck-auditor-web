"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  title: string;
  markdown: string;
  defaultOpen?: boolean;
};

export default function FindingsSection({
  title,
  markdown,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surfaceAlt/50 transition text-left"
      >
        <span className="section-title text-base">{title}</span>
        <ChevronDown
          size={20}
          className={`text-ink-low transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 pt-0 border-t border-border animate-fade-in">
          <div className="prose-invert max-w-none text-sm text-ink-mid space-y-2">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h3: ({ children }) => (
                  <h3 className="text-ink-high font-bold mt-6 mb-2">{children}</h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 marker:text-ink-low">
                    {children}
                  </ul>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-accent-blue/50 pl-3 italic text-ink-low my-2">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="text-ink-high font-semibold">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="bg-surfaceAlt px-1.5 py-0.5 rounded text-xs text-ink-mid">
                    {children}
                  </code>
                ),
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
