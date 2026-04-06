"use client";

import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
}

export function DataTablePagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: DataTablePaginationProps) {
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-muted-foreground text-sm">
        {total === 0 ? "Sin resultados" : `${from}–${to} de ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-muted-foreground px-2 text-sm">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
