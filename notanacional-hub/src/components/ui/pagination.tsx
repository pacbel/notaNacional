import { ButtonHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function PaginationButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
) {
  const { active, ...rest } = props;
  return (
    <Button
      variant={active ? "primary" : "ghost"}
      size="sm"
      className={active ? undefined : "text-slate-600 dark:text-slate-300"}
      {...rest}
    />
  );
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  if (totalPages <= 1) {
    return null;
  }

  const pages: number[] = [];

  for (let i = 1; i <= totalPages; i += 1) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== -1) {
      pages.push(-1);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1 text-sm text-slate-600 dark:text-slate-300">
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </Button>
      {pages.map((p, index) =>
        p === -1 ? (
          <span key={`ellipsis-${index}`} className="px-2 text-slate-400 dark:text-slate-500">
            ...
          </span>
        ) : (
          <PaginationButton
            key={p}
            onClick={() => onPageChange(p)}
            active={p === currentPage}
          >
            {p}
          </PaginationButton>
        )
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Próximo
      </Button>
    </div>
  );
}
