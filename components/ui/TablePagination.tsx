"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Enterprise table pagination footer matching the reference design.
 * Features page number buttons, prev/next arrows, and total result count.
 */
export function TablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-portal-border/60 text-xs font-body select-none",
        className
      )}
    >
      {/* Page Navigation */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) => {
            if (page === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-portal-text-muted">
                  ...
                </span>
              );
            }
            const isCurrent = page === currentPage;
            return (
              <button
                key={`page-${page}`}
                type="button"
                onClick={() => onPageChange(Number(page))}
                className={cn(
                  "w-8 h-8 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center",
                  isCurrent
                    ? "bg-portal-primary text-white shadow-2xs font-bold"
                    : "text-portal-text hover:bg-portal-surface-hover"
                )}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-portal-border bg-portal-surface hover:bg-portal-surface-hover text-portal-text font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Results Count */}
      <div className="text-portal-text-muted order-1 sm:order-2 font-medium">
        Showing <span className="font-semibold text-portal-text">{startItem}</span> to{" "}
        <span className="font-semibold text-portal-text">{endItem}</span> of{" "}
        <span className="font-semibold text-portal-text">{totalItems}</span> results
      </div>
    </div>
  );
}
