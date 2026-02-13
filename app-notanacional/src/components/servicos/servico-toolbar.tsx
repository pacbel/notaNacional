"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ServicoStatusFilter } from "@/services/servicos";

interface ServicosFilters {
  search: string;
  status: ServicoStatusFilter;
  page: number;
  perPage: number;
}

interface ServicoToolbarProps {
  filters: ServicosFilters;
  onChangeFilters: (values: Partial<ServicosFilters>) => void;
  disabled?: boolean;
}

const statusOptions: { label: string; value: ServicoStatusFilter }[] = [
  { label: "Ativos", value: "ativos" },
  { label: "Inativos", value: "inativos" },
  { label: "Todos", value: "todos" },
];

const perPageOptions = [10, 20, 50];

export function ServicoToolbar({ filters, onChangeFilters, disabled = false }: ServicoToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChangeFilters({ search: searchValue });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue, filters.search, onChangeFilters]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full min-w-[220px] sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Buscar por descrição, código ou município"
          className="pl-9"
          disabled={disabled}
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <Select
        value={filters.status}
        onValueChange={(value: ServicoStatusFilter) => onChangeFilters({ status: value, page: 1 })}
        disabled={disabled}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={String(filters.perPage)}
        onValueChange={(value) =>
          onChangeFilters({ perPage: Number(value), page: 1 })
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Itens" />
        </SelectTrigger>
        <SelectContent>
          {perPageOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option} / página
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        disabled={disabled}
        onClick={() =>
          onChangeFilters({
            search: "",
            status: "ativos",
            perPage: 10,
            page: 1,
          })
        }
      >
        Restaurar filtros
      </Button>
    </div>
  );
}
