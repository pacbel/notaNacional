"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createUsuario, updateUsuario } from "@/services/usuarios";
import { listPrestadores } from "@/services/prestadores";
import type { UsuarioDto, CreateUsuarioDto, UpdateUsuarioDto } from "@/lib/validators/usuario";
import type { PrestadorDto } from "@/services/prestadores";

interface UsuarioFormProps {
  usuario?: UsuarioDto;
  onSuccess: () => void;
  onCancel: () => void;
}

const ROLES = [
  { value: "Admin", label: "Administrador" },
  { value: "User", label: "Usuário" },
  { value: "Prestador", label: "Prestador" },
];

export function UsuarioForm({ usuario, onSuccess, onCancel }: UsuarioFormProps) {
  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState(usuario?.role ?? "");
  const [prestadorId, setPrestadorId] = useState<string | null>(usuario?.prestadorId ?? null);

  const queryClient = useQueryClient();

  const prestadoresQuery = useQuery<{ data: PrestadorDto[] }>({
    queryKey: ["prestadores"],
    queryFn: async () => {
      const response = await listPrestadores({ perPage: 100, status: "ativos" });
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      toast.success("Usuário criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUsuarioDto }) =>
      updateUsuario(id, payload),
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuário");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !email || !role) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!usuario && !senha) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    if (usuario) {
      const payload: UpdateUsuarioDto = {
        nome,
        email,
        role,
        prestadorId: prestadorId || null,
        ...(senha && { senha }),
      };
      updateMutation.mutate({ id: usuario.id, payload });
    } else {
      const payload: CreateUsuarioDto = {
        nome,
        email,
        senha,
        role,
        prestadorId: prestadorId || null,
      };
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const prestadores = prestadoresQuery.data?.data ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input
          id="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome completo"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">
          Senha {!usuario && "*"}
          {usuario && " (deixe em branco para não alterar)"}
        </Label>
        <Input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required={!usuario}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select value={role} onValueChange={setRole} disabled={isLoading}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione uma role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prestador">Prestador (opcional)</Label>
        <Select
          value={prestadorId ?? "none"}
          onValueChange={(value) => setPrestadorId(value === "none" ? null : value)}
          disabled={isLoading || prestadoresQuery.isLoading}
        >
          <SelectTrigger id="prestador">
            <SelectValue placeholder="Selecione um prestador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhum</SelectItem>
            {prestadores.map((prestador) => (
              <SelectItem key={prestador.id} value={prestador.id}>
                {prestador.nomeFantasia} - {prestador.cnpj}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {usuario ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
