import { z } from "zod";
import { strongPasswordMessage, strongPasswordRegex } from "@/constants/password";

export const gestorCredentialsSchema = z
  .object({
    nome: z.string().min(3, "Informe o nome completo"),
    email: z.string().email("Informe um e-mail válido"),
    senha: z.string().regex(strongPasswordRegex, strongPasswordMessage),
    confirmarSenha: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.senha !== values.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmarSenha"],
        message: "As senhas devem ser iguais.",
      });
    }
  });

export const gestorCodigoSchema = z.object({
  codigo: z.string().min(4, "Informe o código MFA"),
});

export type GestorCredentialsFormValues = z.infer<typeof gestorCredentialsSchema>;
export type GestorCodigoFormValues = z.infer<typeof gestorCodigoSchema>;
