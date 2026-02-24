"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { listUsuarios, deleteUsuario } from "@/services/usuarios";
import type { UsuarioDto } from "@/lib/validators/usuario";
import { UsuarioForm } from "./usuario-form";
import { ChangePasswordForm } from "./change-password-form";
import { isAdministrador } from "@/lib/permissions";

interface UsuariosPageProps {
  currentUserRole: string;
}

export function UsuariosPage({ currentUserRole }: UsuariosPageProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioDto | null>(null);
  const [deletingUsuario, setDeletingUsuario] = useState<UsuarioDto | null>(null);
  const [changingPasswordUsuario, setChangingPasswordUsuario] = useState<UsuarioDto | null>(null);

  const queryClient = useQueryClient();

  const usuariosQuery = useQuery<UsuarioDto[]>({
    queryKey: ["usuarios"],
    queryFn: listUsuarios,
    staleTime: 5 * 60 * 1000,
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      toast.success("Usuário excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setDeletingUsuario(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir usuário");
    },
  });

  const usuarios = usuariosQuery.data ?? [];

  const handleEdit = (usuario: UsuarioDto) => {
    setEditingUsuario(usuario);
  };

  const handleDelete = (usuario: UsuarioDto) => {
    setDeletingUsuario(usuario);
  };

  const handleChangePassword = (usuario: UsuarioDto) => {
    setChangingPasswordUsuario(usuario);
  };

  const handleCloseDialogs = () => {
    setShowCreateDialog(false);
    setEditingUsuario(null);
    setChangingPasswordUsuario(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-[#1351b4] text-white">
            <TableRow>
              <TableHead className="text-white">Nome</TableHead>
              <TableHead className="text-white">Email</TableHead>
              <TableHead className="text-white">Role</TableHead>
              <TableHead className="text-white">Status</TableHead>
              <TableHead className="text-white text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuariosQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  <p className="mt-2">Carregando usuários...</p>
                </TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum usuário cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => {
                const targetIsAdmin = isAdministrador(usuario.role);
                const currentUserIsAdmin = isAdministrador(currentUserRole);
                const isRestrictedAdmin = targetIsAdmin && !currentUserIsAdmin;

                return (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{usuario.role}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={usuario.ativo ? "default" : "destructive"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRestrictedAdmin}
                        title={
                          isRestrictedAdmin
                            ? "Apenas administradores podem alterar a senha de outros administradores"
                            : undefined
                        }
                        onClick={() => handleChangePassword(usuario)}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRestrictedAdmin}
                        title={
                          isRestrictedAdmin
                            ? "Apenas administradores podem editar outros administradores"
                            : undefined
                        }
                        onClick={() => handleEdit(usuario)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isRestrictedAdmin}
                        title={
                          isRestrictedAdmin
                            ? "Apenas administradores podem excluir outros administradores"
                            : undefined
                        }
                        onClick={() => handleDelete(usuario)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Criação */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário no sistema.
            </DialogDescription>
          </DialogHeader>
          <UsuarioForm onSuccess={handleCloseDialogs} onCancel={handleCloseDialogs} />
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={!!editingUsuario} onOpenChange={(open) => !open && setEditingUsuario(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize os dados do usuário.
            </DialogDescription>
          </DialogHeader>
          {editingUsuario && (
            <UsuarioForm
              usuario={editingUsuario}
              onSuccess={handleCloseDialogs}
              onCancel={handleCloseDialogs}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Alteração de Senha */}
      <Dialog
        open={!!changingPasswordUsuario}
        onOpenChange={(open) => !open && setChangingPasswordUsuario(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Altere a senha do usuário {changingPasswordUsuario?.nome}.
            </DialogDescription>
          </DialogHeader>
          {changingPasswordUsuario && (
            <ChangePasswordForm
              usuarioId={changingPasswordUsuario.id}
              onSuccess={handleCloseDialogs}
              onCancel={handleCloseDialogs}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={!!deletingUsuario}
        onOpenChange={(open) => !open && setDeletingUsuario(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deletingUsuario?.nome}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUsuarioMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteUsuarioMutation.isPending}
              onClick={() => deletingUsuario && deleteUsuarioMutation.mutate(deletingUsuario.id)}
            >
              {deleteUsuarioMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
