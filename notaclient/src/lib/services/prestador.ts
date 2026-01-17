import { getRobotToken } from "@/lib/notanacional-api";
import { getEnv } from "@/lib/env";

export interface PrestadorData {
  id: string;
  nomeFantasia: string;
  razaoSocial: string;
  cnpj: string;
  inscricaoMunicipal?: string;
  email: string;
  telefone?: string;
  codigoMunicipio: string;
  cidade: string;
  estado: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
}

/**
 * Busca dados do prestador da API externa
 * A API retorna lista de prestadores do token, então filtramos pelo ID
 */
export async function getPrestadorById(prestadorId: string): Promise<PrestadorData | null> {
  try {
    const token = await getRobotToken();
    const env = getEnv();

    const response = await fetch(`${env.API_BASE_URL}/api/Prestadores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[PrestadorService] Erro ao buscar prestadores:`, response.status);
      return null;
    }

    const data = await response.json();
    
    // A API pode retornar array ou objeto único
    const prestadores = Array.isArray(data) ? data : [data];
    
    // Filtrar pelo prestadorId
    const prestador = prestadores.find((p: any) => p.id === prestadorId);
    
    if (!prestador) {
      console.warn(`[PrestadorService] Prestador ${prestadorId} não encontrado na lista`);
      return null;
    }

    return prestador;
  } catch (error) {
    console.error(`[PrestadorService] Erro ao buscar prestador ${prestadorId}:`, error);
    return null;
  }
}

/**
 * Busca dados de múltiplos prestadores (otimizado - uma única chamada à API)
 */
export async function getPrestadoresByIds(prestadorIds: string[]): Promise<Map<string, PrestadorData>> {
  const uniqueIds = [...new Set(prestadorIds)];
  const prestadoresMap = new Map<string, PrestadorData>();

  try {
    const token = await getRobotToken();
    const env = getEnv();

    const response = await fetch(`${env.API_BASE_URL}/api/Prestadores`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[PrestadorService] Erro ao buscar prestadores:`, response.status);
      return prestadoresMap;
    }

    const data = await response.json();
    const prestadores = Array.isArray(data) ? data : [data];

    // Mapear apenas os prestadores solicitados
    for (const id of uniqueIds) {
      const prestador = prestadores.find((p: any) => p.id === id);
      if (prestador) {
        prestadoresMap.set(id, prestador);
      }
    }

    return prestadoresMap;
  } catch (error) {
    console.error(`[PrestadorService] Erro ao buscar prestadores:`, error);
    return prestadoresMap;
  }
}
