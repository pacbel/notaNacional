import type { Metadata } from "next";

import ConfiguracoesPage from "@/components/configuracoes/configuracoes-page";

export const metadata: Metadata = {
  title: "Configurações | NotaClient",
};

export default function ConfiguracoesRoute() {
  return <ConfiguracoesPage />;
}
