import type { Metadata } from "next";

import TomadoresPage from "@/components/tomadores/tomadores-page";

export const metadata: Metadata = {
  title: "Tomadores | NotaClient",
};

export default function TomadoresRoute() {
  return <TomadoresPage />;
}
