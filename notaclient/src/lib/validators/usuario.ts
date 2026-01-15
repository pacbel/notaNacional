import { z } from "zod";

export const createUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(150),
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.string().min(1, "Role é obrigatória").max(50),
  prestadorId: z.string().uuid().optional().nullable(),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(150),
  email: z.string().email("Email inválido"),
  role: z.string().max(50).optional().nullable(),
  prestadorId: z.string().uuid().optional().nullable(),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional().nullable(),
});

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter no mínimo 6 caracteres"),
});

export type CreateUsuarioDto = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDto = z.infer<typeof updateUsuarioSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export interface UsuarioDto {
  id: string;
  nome: string;
  email: string;
  role: string;
  prestadorId?: string | null;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
