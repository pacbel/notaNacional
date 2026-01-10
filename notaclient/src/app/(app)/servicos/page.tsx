import type { Metadata } from "next";

import ServicosPage from "@/components/servicos/servicos-page";

export const metadata: Metadata = {
  title: "Serviços | NotaClient",
};

export default function ServicosRoute() {
  return <ServicosPage />;
}
