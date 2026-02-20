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
import type { AssinaturaStatusFilter } from "@/services/assinaturas";

interface AssinaturasFilters {
  search: string;
  status: AssinaturaStatusFilter;
  clienteId: string;
  dataInicio: string;
  dataFim: string;
  page: number;
  perPage: number;
}

interface AssinaturaToolbarProps {
  filters: AssinaturasFilters;
  onChangeFilters: (values: Partial<AssinaturasFilters>) => void;
  disabled?: boolean;
}

const statusOptions: { label: string; value: AssinaturaStatusFilter }[] = [
  { label: "Ativas", value: "ativos" },
  { label: "Inativas", value: "inativos" },
  { label: "Todas", value: "todos" },
];

const perPageOptions = [10, 20, 50];

export function AssinaturaToolbar({ filters, onChangeFilters, disabled = false }: AssinaturaToolbarProps) {
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
          placeholder="Buscar por descrição ou cliente"
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
        onValueChange={(value: AssinaturaStatusFilter) => onChangeFilters({ status: value, page: 1 })}
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

      <Input
        type="date"
        placeholder="Data início"
        value={filters.dataInicio}
        onChange={(e) => onChangeFilters({ dataInicio: e.target.value, page: 1 })}
        disabled={disabled}
        className="w-[140px]"
      />

      <Input
        type="date"
        placeholder="Data fim"
        value={filters.dataFim}
        onChange={(e) => onChangeFilters({ dataFim: e.target.value, page: 1 })}
        disabled={disabled}
        className="w-[140px]"
      />

      <Select
        value={String(filters.perPage)}
        onValueChange={(value) =>
          onChangeFilters({ perPage: Number(value), page: 1 })
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Itens" />
        </SelectTrigger>
        <SelectContent>
          {perPageOptions.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
