/*
  Serviço compartilhado para consulta ao status do serviço de NF-e.
  Pode ser reutilizado por diferentes rotas/APIs sem duplicação de lógica.
*/

export type AmbienteTipo = 1 | 2; // 1 = Produção, 2 = Homologação

export interface StatusServicoParams {
  ufOrigem: string;
  ufDestino: string;
  ambiente: AmbienteTipo;
  versao: string; // ex: '4.00'
}

export type StatusNormalizado = 'operacao' | 'instavel' | 'indisponivel';

export interface StatusServicoResultado {
  ok: boolean;
  status: StatusNormalizado | 'erro';
  fonte: string;
  payload: StatusServicoParams;
  httpStatus?: number;
  resposta?: unknown;
  atualizadoEm: string; // ISO
  message?: string;
  error?: string;
}

const STATUS_URL = 'http://group.grupotenco.com.br/status-servico';

function normalizarStatus(resposta: unknown): StatusNormalizado {
  try {
    const raw = typeof resposta === 'string' ? resposta : JSON.stringify(resposta);
    const rawStr = (raw || '').toLowerCase();

    // Heurísticas simples de detecção
    if (rawStr.includes('indispon') || rawStr.includes('paralis') || rawStr.includes('fora')) {
      return 'indisponivel';
    }
    if (rawStr.includes('oper')) {
      return 'operacao';
    }
    return 'instavel';
  } catch {
    return 'instavel';
  }
}

export async function consultarStatusServico(params: StatusServicoParams): Promise<StatusServicoResultado> {
  const payload: StatusServicoParams = {
    ufOrigem: params.ufOrigem,
    ufDestino: params.ufDestino,
    ambiente: params.ambiente,
    versao: params.versao,
  };

  try {
    const resp = await fetch(STATUS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    const status = normalizarStatus(data);

    return {
      ok: true,
      status,
      fonte: STATUS_URL,
      payload,
      httpStatus: resp.status,
      resposta: data,
      atualizadoEm: new Date().toISOString(),
    };
  } catch (error: unknown) {
    return {
      ok: false,
      status: 'erro',
      fonte: STATUS_URL,
      payload: params,
      atualizadoEm: new Date().toISOString(),
      message: 'Falha ao consultar o status do serviço.',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
