import type { Metadata } from "next";

import PrestadoresPage from "@/components/prestadores/prestadores-page";

export const metadata: Metadata = {
  title: "Prestadores | NotaClient",
};

export default function PrestadoresRoute() {
  return <PrestadoresPage />;
}
