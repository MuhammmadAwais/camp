"use client";

import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { SortDirection } from "@/hooks/useTableSort";
import { cn } from "@/lib/utils";

export interface SortableHeaderProps {
  label: string;
  direction?: SortDirection;
  onSort?: () => void;
  align?: "left" | "center" | "right";
  className?: string;
  uppercase?: boolean;
}

/**
 * Enterprise table column header matching modern SaaS reference styling.
 * Supports interactive sorting indicators, Title Case typography, and accessible keyboard focus.
 */
export function SortableHeader({
  label,
  direction = null,
  onSort,
  align = "left",
  className,
  uppercase = false,
}: SortableHeaderProps) {
  if (!onSort) {
    return (
      <th
        className={cn(
          "px-4 py-3.5 text-xs font-semibold text-portal-text-muted select-none",
          uppercase && "text-[11px] font-bold uppercase tracking-wider",
          align === "right" && "text-right",
          align === "center" && "text-center",
          className
        )}
      >
        {label}
      </th>
    );
  }

  return (
    <th
      className={cn(
        "px-4 py-3.5 select-none",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "group inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-portal-primary/50",
          uppercase && "text-[11px] font-bold uppercase tracking-wider",
          direction
            ? "text-portal-text font-bold"
            : "text-portal-text-muted hover:text-portal-text",
          align === "right" && "flex-row-reverse"
        )}
        aria-label={`Sort by ${label} ${
          direction === "asc"
            ? "descending"
            : direction === "desc"
            ? "clear sort"
            : "ascending"
        }`}
      >
        <span>{label}</span>
        <span
          className={cn(
            "p-0.5 rounded transition-all",
            direction
              ? "bg-portal-primary/10 text-portal-primary"
              : "text-portal-text-muted/40 group-hover:text-portal-text group-hover:opacity-100 opacity-60"
          )}
        >
          {direction === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5 text-portal-primary" />
          ) : direction === "desc" ? (
            <ArrowDown className="w-3.5 h-3.5 text-portal-primary" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </span>
      </button>
    </th>
  );
}
