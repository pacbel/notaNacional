"use client";

import { useMemo, useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus, Pencil, Trash2, KeyRound, Search, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { useApiQuery } from "@/hooks/use-api-query";
import { useApiMutation } from "@/hooks/use-api-mutation";
import {
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
  removerUsuario,
  alterarSenha,
} from "@/services/usuarios";
import { listarPrestadores } from "@/services/prestadores";
import { UsuarioDto, CreateUsuarioDto, UpdateUsuarioDto } from "@/types/usuarios";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { useQueryClient } from "@tanstack/react-query";

const roleOptions = [
  { value: "Administrador", label: "Administrador" },
  { value: "Gestao", label: "Gestão" },
  { value: "Operacao", label: "Operação" },
];

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const strongPasswordMessage =
  "A senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolo.";

const userSchema = z
  .object({
    nome: z.string().min(3, "Informe o nome completo"),
    email: z.string().email("Informe um e-mail válido"),
    role: z.enum(["Administrador", "Gestao", "Operacao"], {
      required_error: "Selecione um perfil",
    }),
    prestadorId: z.string().min(1, "Selecione um prestador"),
    senha: z.string().optional(),
    confirmarSenha: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.senha || data.confirmarSenha) {
      if (!data.senha) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["senha"],
          message: "Informe a senha.",
        });
      }

      if (!data.confirmarSenha) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmarSenha"],
          message: "Confirme a senha.",
        });
      }

      if (data.senha && data.confirmarSenha) {
        if (data.senha !== data.confirmarSenha) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["confirmarSenha"],
            message: "As senhas não coincidem.",
          });
        } else if (!strongPasswordRegex.test(data.senha)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["senha"],
            message: strongPasswordMessage,
          });
        }
      }
    }
  });

type UsuarioFormValues = z.infer<typeof userSchema>;

const changePasswordSchema = z.object({
  senhaAtual: z.string().min(6, "Informe a senha atual"),
  novaSenha: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function UsuariosPage() {
  const { roles } = useAuth();
  const queryClient = useQueryClient();
  const isAdministrador = roles.includes("Administrador");

  const [searchTerm, setSearchTerm] = useState("");
  const [prestadorIdFilter, setPrestadorIdFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioDto | null>(null);
  const [passwordUser, setPasswordUser] = useState<UsuarioDto | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = editingUser !== null;

  const usuariosQuery = useApiQuery({
    queryKey: ["usuarios"],
    queryFn: listarUsuarios,
    enabled: isAdministrador,
  });

  const prestadoresQuery = useApiQuery({
    queryKey: ["prestadores"],
    queryFn: listarPrestadores,
    enabled: isAdministrador,
  });

  const initialFormValues: UsuarioFormValues = {
    nome: "",
    email: "",
    role: "Operacao",
    prestadorId: "",
    senha: "",
    confirmarSenha: "",
  };

  const form = useForm<UsuarioFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: initialFormValues,
  });

  const senhaValue = form.watch("senha") ?? "";

  const passwordRequirements = useMemo(
    () => [
      {
        id: "length",
        label: "Ao menos 8 caracteres",
        met: senhaValue.length >= 8,
      },
      {
        id: "uppercase",
        label: "Uma letra maiúscula",
        met: /[A-Z]/.test(senhaValue),
      },
      {
        id: "lowercase",
        label: "Uma letra minúscula",
        met: /[a-z]/.test(senhaValue),
      },
      {
        id: "number",
        label: "Um número",
        met: /\d/.test(senhaValue),
      },
      {
        id: "special",
        label: "Um caractere especial",
        met: /[\W_]/.test(senhaValue),
      },
    ],
    [senhaValue]
  );

  const confirmarSenhaValue = form.watch("confirmarSenha") ?? "";
  const matchesRequirement = senhaValue.length > 0 && confirmarSenhaValue === senhaValue;

  const passwordForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      senhaAtual: "",
      novaSenha: "",
    },
  });

  const prestadorOptions = useMemo(() => {
    return (prestadoresQuery.data ?? []).map((prestador) => ({
      value: prestador.id,
      label: `${prestador.nomeFantasia} (${prestador.cnpj})`,
    }));
  }, [prestadoresQuery.data]);

  useEffect(() => {
    if (!isFormOpen || editingUser || prestadorOptions.length === 0) {
      return;
    }

    const current = form.getValues("prestadorId");
    if (!current) {
      form.setValue("prestadorId", prestadorOptions[0].value, {
        shouldDirty: true,
      });
    }
  }, [isFormOpen, editingUser, prestadorOptions, form]);

  const prestadorMap = useMemo(() => {
    const map = new Map<string, string>();
    (prestadoresQuery.data ?? []).forEach((prestador) => {
      map.set(prestador.id, prestador.nomeFantasia);
    });
    return map;
  }, [prestadoresQuery.data]);

  const filteredUsuarios = useMemo(() => {
    const data = usuariosQuery.data ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data.filter((usuario) => {
      const matchesSearch = normalizedSearch
        ? [usuario.nome, usuario.email, usuario.role]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(normalizedSearch))
        : true;

      const matchesPrestador = prestadorIdFilter
        ? usuario.prestadorId === prestadorIdFilter
        : true;

      return matchesSearch && matchesPrestador;
    });
  }, [usuariosQuery.data, searchTerm, prestadorIdFilter]);

  const totalItems = filteredUsuarios.length;
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const createMutation = useApiMutation(
    (payload: CreateUsuarioDto) => criarUsuario(payload),
    {
      successMessage: "Usuário criado com sucesso.",
      onSuccess: () => {
        setIsFormOpen(false);
        setEditingUser(null);
        form.reset();
        form.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      },
    }
  );

  const updateMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: UpdateUsuarioDto }) =>
      atualizarUsuario(id, payload),
    {
      successMessage: "Usuário atualizado.",
      onSuccess: () => {
        setIsFormOpen(false);
        setEditingUser(null);
        form.reset();
        form.clearErrors();
        setShowPassword(false);
        setShowConfirmPassword(false);
        queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      },
    }
  );

  const deleteMutation = useApiMutation((id: string) => removerUsuario(id), {
    successMessage: "Usuário removido.",
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  const changePasswordMutation = useApiMutation(
    ({ id, payload }: { id: string; payload: { senhaAtual: string; novaSenha: string } }) =>
      alterarSenha(id, payload),
    {
      successMessage: "Senha alterada com sucesso.",
      onSuccess: () => {
        setPasswordUser(null);
        passwordForm.reset();
      },
    }
  );

  const openCreateModal = () => {
    const defaultPrestador = prestadorOptions[0]?.value ?? "";
    form.reset({ ...initialFormValues, prestadorId: defaultPrestador });
    form.clearErrors();
    setEditingUser(null);
    setIsFormOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openEditModal = (usuario: UsuarioDto) => {
    form.reset({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role as UsuarioFormValues["role"],
      prestadorId: usuario.prestadorId ?? prestadorOptions[0]?.value ?? "",
      senha: "",
      confirmarSenha: "",
    });
    form.clearErrors();
    setEditingUser(usuario);
    setIsFormOpen(true);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    form.reset(initialFormValues);
    form.clearErrors();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const onSubmitForm = form.handleSubmit(async (values) => {
    const senha = (values.senha ?? "").trim();
    const confirmarSenha = (values.confirmarSenha ?? "").trim();

    if (editingUser) {
      const payload: UpdateUsuarioDto = {
        nome: values.nome,
        email: values.email,
        role: values.role,
        prestadorId: values.prestadorId,
      };

      const senhaInformada = senha.length > 0 || confirmarSenha.length > 0;
      if (senhaInformada) {
        if (!senha) {
          form.setError("senha", {
            type: "manual",
            message: "Informe a senha.",
          });
          return;
        }

        if (!confirmarSenha) {
          form.setError("confirmarSenha", {
            type: "manual",
            message: "Confirme a senha.",
          });
          return;
        }

        if (senha !== confirmarSenha) {
          form.setError("confirmarSenha", {
            type: "manual",
            message: "As senhas não coincidem.",
          });
          return;
        }

        if (!strongPasswordRegex.test(senha)) {
          form.setError("senha", {
            type: "manual",
            message: strongPasswordMessage,
          });
          return;
        }

        payload.senha = senha;
      }

      await updateMutation.mutateAsync({ id: editingUser.id, payload });
      return;
    }

    if (!senha) {
      form.setError("senha", {
        type: "manual",
        message: "Informe a senha.",
      });
      return;
    }

    if (!confirmarSenha) {
      form.setError("confirmarSenha", {
        type: "manual",
        message: "Confirme a senha.",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      form.setError("confirmarSenha", {
        type: "manual",
        message: "As senhas não coincidem.",
      });
      return;
    }

    if (!strongPasswordRegex.test(senha)) {
      form.setError("senha", {
        type: "manual",
        message: strongPasswordMessage,
      });
      return;
    }

    const payload: CreateUsuarioDto = {
      nome: values.nome,
      email: values.email,
      role: values.role,
      prestadorId: values.prestadorId,
      senha,
    };

    await createMutation.mutateAsync(payload);
    setPage(1);
  });

  const onSubmitPassword = passwordForm.handleSubmit(async (values) => {
    if (!passwordUser) return;
    await changePasswordMutation.mutateAsync({
      id: passwordUser.id,
      payload: { senhaAtual: values.senhaAtual, novaSenha: values.novaSenha },
    });
  });

  const openPasswordModal = (usuario: UsuarioDto) => {
    setPasswordUser(usuario);
    passwordForm.reset({ senhaAtual: "", novaSenha: "" });
  };

  const closePasswordModal = () => {
    setPasswordUser(null);
    passwordForm.reset();
  };

  const handleDelete = async (usuario: UsuarioDto) => {
    if (
      window.confirm(
        `Confirma a exclusão do usuário ${usuario.nome} (${usuario.email})?`
      )
    ) {
      await deleteMutation.mutateAsync(usuario.id);
    }
  };

  if (!isAdministrador) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Permissão insuficiente</CardTitle>
          </CardHeader>
          <p className="px-6 pb-6 text-sm text-slate-600">
            Você precisa do perfil Administrador para acessar a gestão de usuários.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">
            Gerencie acesso dos colaboradores conforme roles definidos na API.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo usuário
        </Button>
      </header>

      <Card>
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
              <div className="relative flex w-full max-w-md items-center">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Pesquisar por nome, e-mail ou role"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex w-full max-w-xs flex-col">
                <label className="text-sm font-medium text-slate-600" htmlFor="prestador-filter">
                  Prestador
                </label>
                <Select
                  id="prestador-filter"
                  value={prestadorIdFilter}
                  onChange={(event) => {
                    setPrestadorIdFilter(event.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Todos os prestadores</option>
                  {prestadorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {totalItems} resultado{totalItems === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead className="w-40 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium text-slate-900">
                      {usuario.nome}
                    </TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.role}</TableCell>
                    <TableCell>
                      {usuario.prestadorId
                        ? prestadorMap.get(usuario.prestadorId) ?? "Associado"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(usuario)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordModal(usuario)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(usuario)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedUsuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={currentPage}
            pageSize={pageSize}
            total={totalItems}
            onPageChange={setPage}
          />
        </div>
      </Card>

      {(isFormOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                {editingUser ? "Editar usuário" : "Novo usuário"}
              </h2>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={closeFormModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSubmitForm} className="space-y-4 px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="nome">
                    Nome completo
                  </label>
                  <Input id="nome" {...form.register("nome")} />
                  {form.formState.errors.nome && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.nome.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="email">
                    E-mail
                  </label>
                  <Input id="email" type="email" {...form.register("email")} />
                  {form.formState.errors.email && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.email.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="role">
                    Role
                  </label>
                  <Select id="role" {...form.register("role")}>
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </Select>
                  {form.formState.errors.role && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.role.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-sm font-medium text-slate-600"
                    htmlFor="prestadorId"
                  >
                    Prestador
                  </label>
                  <Controller
                    control={form.control}
                    name="prestadorId"
                    render={({ field }) => (
                      <Select
                        id="prestadorId"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                      >
                        {prestadorOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  {form.formState.errors.prestadorId && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.prestadorId.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="senha">
                    {isEditing ? "Nova senha (opcional)" : "Senha"}
                  </label>
                  <div className="relative">
                    <Input
                      id="senha"
                      type={showPassword ? "text" : "password"}
                      className="pr-10"
                      autoComplete="new-password"
                      {...form.register("senha")}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition-colors hover:text-slate-700"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500">Atenda aos requisitos abaixo:</p>
                    <ul className="space-y-1">
                      {passwordRequirements.map((requirement) => (
                        <li
                          key={requirement.id}
                          className={`flex items-center gap-2 ${requirement.met ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {requirement.met ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <span>{requirement.label}</span>
                        </li>
                      ))}
                    </ul>
                    {isEditing && (
                      <p className="text-slate-500">Deixe em branco para manter a senha atual.</p>
                    )}
                  </div>
                  {form.formState.errors.senha && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.senha.message}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-600" htmlFor="confirmarSenha">
                    {isEditing ? "Confirmar nova senha" : "Confirmar senha"}
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pr-10"
                      autoComplete="new-password"
                      {...form.register("confirmarSenha")}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition-colors hover:text-slate-700"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? "Ocultar confirmação" : "Mostrar confirmação"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <ul className="space-y-1">
                      <li
                        className={`flex items-center gap-2 ${matchesRequirement ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {matchesRequirement ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span>As senhas devem coincidir</span>
                      </li>
                    </ul>
                  </div>
                  {form.formState.errors.confirmarSenha && (
                    <span className="text-sm text-red-600">
                      {form.formState.errors.confirmarSenha.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={closeFormModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingUser ? "Salvar alterações" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Alterar senha</h2>
                <p className="text-sm text-slate-500">
                  {passwordUser.nome} ({passwordUser.email})
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 transition-colors hover:text-slate-600"
                onClick={closePasswordModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSubmitPassword} className="space-y-4 px-6 py-5">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600" htmlFor="senhaAtual">
                  Senha atual
                </label>
                <Input
                  id="senhaAtual"
                  type="password"
                  {...passwordForm.register("senhaAtual")}
                />
                {passwordForm.formState.errors.senhaAtual && (
                  <span className="text-sm text-red-600">
                    {passwordForm.formState.errors.senhaAtual.message}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-600" htmlFor="novaSenha">
                  Nova senha
                </label>
                <Input
                  id="novaSenha"
                  type="password"
                  {...passwordForm.register("novaSenha")}
                />
                {passwordForm.formState.errors.novaSenha && (
                  <span className="text-sm text-red-600">
                    {passwordForm.formState.errors.novaSenha.message}
                  </span>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={closePasswordModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={changePasswordMutation.isPending}>
                  Alterar senha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
