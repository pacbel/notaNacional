"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { changePassword } from "@/services/usuarios";
import type { ChangePasswordDto } from "@/lib/validators/usuario";

interface ChangePasswordFormProps {
  usuarioId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ChangePasswordForm({ usuarioId, onSuccess, onCancel }: ChangePasswordFormProps) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const queryClient = useQueryClient();

  const changePasswordMutation = useMutation({
    mutationFn: (payload: ChangePasswordDto) => changePassword(usuarioId, payload),
    onSuccess: () => {
      toast.success("Senha alterada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      onSuccess();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar senha");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    changePasswordMutation.mutate({
      senhaAtual,
      novaSenha,
    });
  };

  const isLoading = changePasswordMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="senhaAtual">Senha Atual *</Label>
        <Input
          id="senhaAtual"
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="novaSenha">Nova Senha *</Label>
        <Input
          id="novaSenha"
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
        <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
        <Input
          id="confirmarSenha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          placeholder="••••••••"
          disabled={isLoading}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Alterar Senha
        </Button>
      </div>
    </form>
  );
}
