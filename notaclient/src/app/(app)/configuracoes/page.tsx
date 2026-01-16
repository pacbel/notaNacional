import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ConfiguracaoNfseForm from "@/components/configuracoes/configuracao-nfse-form";
import { getCurrentUser } from "@/lib/auth";
import { canAccessConfiguracoes } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Configuração NFSe | NotaClient",
};

export default async function ConfiguracoesRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  // Verificar permissão
  if (!canAccessConfiguracoes(user.role)) {
    redirect("/dashboard");
  }

  return <ConfiguracaoNfseForm />;
}
