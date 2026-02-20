import type { Metadata } from "next";

import AssinaturasPage from "@/components/assinaturas/assinaturas-page";

export const metadata: Metadata = {
  title: "Assinaturas | NotaClient",
};

export default function AssinaturasRoute() {
  return <AssinaturasPage />;
}
