"use client";

import * as React from "react";
import { cn } from "cn";

function Table({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"table"> & { size?: "default" | "sm" }) {
  return (
    <div data-slot="table-container" className="w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn(
          "w-full caption-bottom text-sm",
          size === "sm" && "text-xs [&_th]:h-8 [&_th]:px-2 [&_td]:px-2 [&_td]:py-1",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

function TableBody({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"tbody"> & { tone?: "default" | "muted" }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        "[&_tr:last-child]:border-0",
        tone === "muted" && "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted/50 [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

function TableRow({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"tr"> & { tone?: "default" | "current" }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        tone === "current" && "bg-accent/60 font-semibold text-primary",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-3 text-left align-middle font-semibold whitespace-nowrap text-primary [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"td"> & { tone?: "default" | "muted" | "primary" | "destructive" }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        tone === "muted" && "text-muted-foreground",
        tone === "primary" && "text-primary",
        tone === "destructive" && "text-destructive",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
