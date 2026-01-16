const IBGE_BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export interface IbgeUf {
  id: number;
  sigla: string;
  nome: string;
}

export interface IbgeMunicipio {
  id: number;
  nome: string;
}

export interface IbgeMunicipioDetalhado extends IbgeMunicipio {
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        id: number;
        sigla: string;
        nome: string;
      };
    };
  };
}

async function fetchFromIbge<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${IBGE_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Erro ao consultar IBGE: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function listarUfs(): Promise<IbgeUf[]> {
  const estados = await fetchFromIbge<IbgeUf[]>("/estados");
  return estados.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function listarMunicipiosPorUf(ufId: number): Promise<IbgeMunicipio[]> {
  const municipios = await fetchFromIbge<IbgeMunicipio[]>(`/estados/${ufId}/municipios`);
  return municipios.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function obterMunicipioPorCodigoIbge(codigo: string | number): Promise<IbgeMunicipioDetalhado> {
  const municipioId = typeof codigo === "number" ? codigo : Number.parseInt(codigo, 10);

  if (Number.isNaN(municipioId)) {
    throw new Error("Código IBGE inválido");
  }

  return fetchFromIbge<IbgeMunicipioDetalhado>(`/municipios/${municipioId}`);
}
