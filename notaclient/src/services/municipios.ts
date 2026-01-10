export interface MunicipioDto {
  codigo: string;
  nome: string;
  uf: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error("Erro ao carregar municípios do IBGE");
  }

  return (await response.json()) as T;
}

export async function listMunicipios(uf?: string): Promise<MunicipioDto[]> {
  const params = new URLSearchParams();

  if (uf) {
    params.set("uf", uf);
  }

  const queryString = params.size > 0 ? `?${params.toString()}` : "";

  const response = await fetch(`/api/municipios${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  return handleResponse<MunicipioDto[]>(response);
}
