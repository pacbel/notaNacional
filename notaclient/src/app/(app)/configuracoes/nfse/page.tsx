import type { Metadata } from "next";

import ConfiguracoesPage from "@/components/configuracoes/configuracoes-page";

export const metadata: Metadata = {
  title: "Configuração NFSe | NotaClient",
};

export default function ConfiguracoesNfseRoute() {
  return <ConfiguracoesPage />;
}
