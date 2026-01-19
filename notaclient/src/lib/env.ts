import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  ROBOT_CLIENT_ID: z.string().min(1),
  ROBOT_CLIENT_SECRET: z.string().min(1),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET precisa ter pelo menos 32 caracteres"),
  SEED_SENHA_PADRAO: z.string().min(8).default("ChangeMe123!"),
  PUBLIC_API_USER: z.string().min(1),
  PUBLIC_API_PASSWORD: z.string().min(1),
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
