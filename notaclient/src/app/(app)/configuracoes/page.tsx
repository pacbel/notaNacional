import type { Metadata } from "next";

import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Configurações | NotaClient",
};

export default function ConfiguracoesRoute() {
  redirect("/configuracoes/nfse");
}
