import type { ReactNode } from "react";

/** Notion-style quote: serif body behind a left rule, used for method captions. */
export function ChartQuote({ children }: { children: ReactNode }) {
  return (
    <blockquote className="border-foreground/60 m-0! border-l-2 pl-3 font-serif text-[13px] leading-[1.55] sm:text-sm sm:leading-[1.7]">
      {children}
    </blockquote>
  );
}

/** Inline value chip inside a ChartQuote. */
export function ChartCode({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted rounded-[0.3rem] px-[0.3rem] py-[0.15rem] font-mono text-[0.9em]">
      {children}
    </code>
  );
}
