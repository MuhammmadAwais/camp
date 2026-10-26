"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc" | null;

export type SortAccessor<T> = 
  | keyof T 
  | ((item: T) => string | number | boolean | Date | null | undefined);

export interface SortConfig<T> {
  key: SortAccessor<T> | null;
  direction: SortDirection;
}

export interface UseTableSortOptions<T> {
  initialKey?: SortAccessor<T>;
  initialDirection?: SortDirection;
}

/**
 * Universal, type-safe table sorting hook for AutoNexa data grids.
 * Supports numbers, strings, ISO dates, integer CAD cents, and custom accessors.
 */
export function useTableSort<T>(
  data: T[],
  options: UseTableSortOptions<T> = {}
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: options.initialKey ?? null,
    direction: options.initialDirection ?? null,
  });

  const requestSort = useCallback(
    (key: SortAccessor<T>, defaultDirection: SortDirection = "asc") => {
      setSortConfig((prev) => {
        // If clicking the same key
        if (prev.key === key) {
          if (prev.direction === "asc") {
            return { key, direction: "desc" };
          }
          if (prev.direction === "desc") {
            // Cycle back to unsorted (natural order)
            return { key: null, direction: null };
          }
          return { key, direction: defaultDirection ?? "asc" };
        }
        // New key clicked
        return { key, direction: defaultDirection ?? "asc" };
      });
    },
    []
  );

  const resetSort = useCallback(() => {
    setSortConfig({ key: null, direction: null });
  }, []);

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    const { key, direction } = sortConfig;
    const sorted = [...data].sort((a, b) => {
      const valA = typeof key === "function" ? key(a) : a[key];
      const valB = typeof key === "function" ? key(b) : b[key];

      // Handle nullish values (push nulls/undefined to end)
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Numerical comparisons (handles CAD cents, counts, etc.)
      if (typeof valA === "number" && typeof valB === "number") {
        return direction === "asc" ? valA - valB : valB - valA;
      }

      // Boolean comparisons
      if (typeof valA === "boolean" && typeof valB === "boolean") {
        const numA = valA ? 1 : 0;
        const numB = valB ? 1 : 0;
        return direction === "asc" ? numA - numB : numB - numA;
      }

      // Date comparisons
      if (valA instanceof Date && valB instanceof Date) {
        return direction === "asc"
          ? valA.getTime() - valB.getTime()
          : valB.getTime() - valA.getTime();
      }

      // String comparisons (with ISO date heuristic & natural numeric sorting)
      const strA = String(valA);
      const strB = String(valB);

      // Check if strings look like ISO dates (e.g. 2026-10-20T...)
      const dateA = Date.parse(strA);
      const dateB = Date.parse(strB);
      if (!isNaN(dateA) && !isNaN(dateB) && strA.includes("-") && strB.includes("-")) {
        return direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Natural language locale comparison
      const cmp = strA.localeCompare(strB, undefined, {
        numeric: true,
        sensitivity: "base",
      });

      return direction === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [data, sortConfig]);

  const isSorted = useCallback(
    (key: SortAccessor<T>) => {
      if (sortConfig.key === key) {
        return sortConfig.direction;
      }
      return null;
    },
    [sortConfig]
  );

  return {
    sortedData,
    sortConfig,
    requestSort,
    resetSort,
    isSorted,
  };
}
