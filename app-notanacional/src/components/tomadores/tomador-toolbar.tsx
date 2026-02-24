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
import type { TomadorStatusFilter } from "@/services/tomadores";

interface TomadoresFilters {
  search: string;
  status: TomadorStatusFilter;
  page: number;
  perPage: number;
  documento: string;
}

interface TomadorToolbarProps {
  filters: TomadoresFilters;
  onChangeFilters: (values: Partial<TomadoresFilters>) => void;
  disabled?: boolean;
}

const statusOptions: { label: string; value: TomadorStatusFilter }[] = [
  { label: "Ativos", value: "ativos" },
  { label: "Inativos", value: "inativos" },
  { label: "Todos", value: "todos" },
];

const perPageOptions = [10, 20, 50];

export function TomadorToolbar({ filters, onChangeFilters, disabled = false }: TomadorToolbarProps) {
  const [searchValue, setSearchValue] = useState(filters.search);
  const [documentValue, setDocumentValue] = useState(filters.documento);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    setDocumentValue(filters.documento);
  }, [filters.documento]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChangeFilters({ search: searchValue });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue, filters.search, onChangeFilters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (documentValue !== filters.documento) {
        onChangeFilters({ documento: documentValue });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [documentValue, filters.documento, onChangeFilters]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full min-w-[220px] sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Buscar por nome ou e-mail"
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

      <Input
        value={documentValue}
        onChange={(event) => setDocumentValue(event.target.value.replace(/\D/g, ""))}
        placeholder="Documento (CPF/CNPJ)"
        className="w-[180px]"
        disabled={disabled}
      />

      <Select
        value={filters.status}
        onValueChange={(value: TomadorStatusFilter) => onChangeFilters({ status: value })}
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
              {option} / pág
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => onChangeFilters({ search: "", status: "ativos", perPage: 10, documento: "", page: 1 })}
      >
        Restaurar filtros
      </Button>
    </div>
  );
}
