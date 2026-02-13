import { NextResponse } from "next/server";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface IbgeMunicipioResponse {
  id: number;
  nome: string;
  microrregiao: {
    mesorregiao: {
      UF: {
        sigla: string;
      };
    };
  };
}

function buildEndpoint(uf?: string) {
  if (uf) {
    return `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`;
  }

  return "https://servicodados.ibge.gov.br/api/v1/localidades/municipios";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uf = searchParams.get("uf")?.toUpperCase();

    const endpoint = buildEndpoint(uf ?? undefined);

    const response = await fetchWithAuth(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.json({ message: "Erro ao consultar municípios no IBGE" }, { status: 502 });
    }

    const data = (await response.json()) as IbgeMunicipioResponse[];

    const mapped = data
      .map((item) => ({
        codigo: String(item.id),
        nome: item.nome,
        uf: item.microrregiao.mesorregiao.UF.sigla,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ message: "Erro ao consultar municípios" }, { status: 500 });
  }
}
