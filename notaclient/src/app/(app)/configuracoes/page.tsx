import type { Metadata } from "next";

import ConfiguracaoNfseForm from "@/components/configuracoes/configuracao-nfse-form";

export const metadata: Metadata = {
  title: "Configuração NFSe | NotaClient",
};

export default function ConfiguracoesRoute() {
  return <ConfiguracaoNfseForm />;
}
