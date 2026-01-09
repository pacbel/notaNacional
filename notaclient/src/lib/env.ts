import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NOTA_API_BASE_URL: z.string().url(),
  ROBOT_CLIENT_ID: z.string().min(1),
  ROBOT_CLIENT_SECRET: z.string().min(1),
  ROBOT_SCOPE: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET precisa ter pelo menos 32 caracteres"),
  MFA_EMAIL_ASSUNTO: z.string().min(1),
  RECOVERY_EMAIL_ASSUNTO: z.string().min(1),
  SEED_SENHA_PADRAO: z.string().min(8).default("ChangeMe123!"),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      const formatted = parsed.error.flatten().fieldErrors;
      const messages = Object.entries(formatted)
        .map(([key, errors]) => `${key}: ${errors?.join(", ")}`)
        .join(" | ");
      throw new Error(`Variáveis de ambiente inválidas: ${messages}`);
    }

    cachedEnv = parsed.data;
  }

  return cachedEnv;
}
