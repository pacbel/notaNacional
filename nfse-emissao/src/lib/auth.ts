import { NextAuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcrypt";
import { JWT } from "next-auth/jwt";

// Estender os tipos para incluir propriedades personalizadas
declare module "next-auth" {
  interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    prestadorId: string;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      prestadorId: string;
    }
  }
}

// Configuração do NextAuth com um segredo forte e consistente
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.usuario.findFirst({
          where: {
            username: credentials.username,
            ativo: true
          }
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        // Atualizar último acesso
        await prisma.usuario.update({
          where: { id: user.id },
          data: { last_access: new Date() }
        });

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          role: user.role,
          prestadorId: user.prestadorId
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT, user?: { id: string; role: string; prestadorId: string } }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.prestadorId = user.prestadorId;
      }
      return token;
    },
    async session({ session, token }: { session: Session, token: JWT }) {
      if (token && session.user) {
        // Tipos estendidos via module augmentation acima
        (session.user as unknown as { id: string }).id = token.id as string;
        (session.user as unknown as { role: string }).role = token.role as string;
        (session.user as unknown as { prestadorId: string }).prestadorId = token.prestadorId as string;
      }
      return session;
    }
  }
};
