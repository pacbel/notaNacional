// UTF-8
// Funções isoladas para reconciliar status de NFS-e com a SEFIN/NFSe Nacional
// Não altera funções existentes. Pode ser chamada por rota dedicada.

import { prisma } from '@/lib/prisma'

export type StatusExterno = 'autorizada' | 'cancelada' | 'nao_encontrada' | 'desconhecido'

export interface ConsultaExternaOptions {
  ambiente: 1 | 2 | number
  certificateId?: string
  baseUrl?: string // URL do cliente local (ex.: https://localhost:5179) ou gateway
}

export interface ResultadoReconciliacao {
  chave: string
  statusExterno: StatusExterno
  statusInternoAntes?: string
  atualizado?: boolean
  erro?: string
}

/**
 * Consulta status na infraestrutura local/SEFIN por chave. Não depende das funções existentes.
 * Tenta múltiplos caminhos conhecidos; se não obtiver status, retorna 'desconhecido'.
 */
export async function consultarStatusExternoPorChave(chave: string, opt: ConsultaExternaOptions): Promise<StatusExterno> {
  const base = (opt.baseUrl || process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || 'https://localhost:5179').replace(/\/$/, '')
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
  }
  if (opt.certificateId) headers['X-Certificate-Id'] = opt.certificateId
  if (opt.ambiente === 1 || opt.ambiente === 2) headers['X-Ambiente'] = String(opt.ambiente)

  // Estratégias conhecidas (alguns clientes locais implementam):
  const candidates = [
    `${base}/nfse/status/${encodeURIComponent(chave)}`,
    `${base}/nfse/consultar/${encodeURIComponent(chave)}`,
    `${base}/nfse/${encodeURIComponent(chave)}`,
  ]

  for (const url of candidates) {
    try {
      console.log('[Reconcile][HTTP][GET]', url)
      const r = await fetch(url, { method: 'GET', headers })
      if (r.status === 404) continue
      const ct = r.headers.get('content-type') || ''
      const raw = await r.text()
      console.log('[Reconcile][HTTP][RESP]', { status: r.status, ct, len: raw?.length })
      if (!r.ok) continue
      if (ct.includes('application/json')) {
        try {
          const j = JSON.parse(raw)
          // Mapeamentos comuns: status, situacao, codigoStatus etc
          const val = String(
            j?.status ?? j?.situacao ?? j?.codigoStatus ?? j?.dados?.status ?? j?.dados?.situacao ?? ''
          ).toLowerCase()
          console.log('[Reconcile][PARSE][jsonVal]', val)
          if (/(cancelad|101101)/.test(val)) return 'cancelada'
          if (/(autorizad|emitid|ok|200)/.test(val)) return 'autorizada'
        } catch {}
      } else {
        // Alguns retornos podem ser XML/texto. Heurísticas mínimas:
        const low = raw.toLowerCase()
        console.log('[Reconcile][PARSE][text-scan]')
        if (low.includes('cancel') || low.includes('<e101101') || low.includes('<descEvento>cancelamento')) return 'cancelada'
        if (low.includes('autoriz') || low.includes('<nfse')) return 'autorizada'
      }
    } catch {
      // tenta próximo
    }
  }

  return 'desconhecido'
}

/**
 * Reconciliar status por chave e atualizar no banco caso divirja (best-effort).
 * Não cria side-effects fora do update do registro.
 */
export async function reconciliarStatusPorChave(chave: string, opt: ConsultaExternaOptions): Promise<ResultadoReconciliacao> {
  const ch50 = String(chave || '').replace(/\D+/g, '')
  const statusExterno = await consultarStatusExternoPorChave(ch50, opt)
  console.log('[Reconcile][RESULT][externo]', { chave: ch50, statusExterno })

  // Buscar nota por chave ou por nfseXML contendo chave
  const nota = await prisma.notafiscal.findFirst({
    where: { OR: [ { chaveAcesso: ch50 }, { nfseXML: { contains: ch50 } } ] },
    select: { id: true, status: true }
  })

  const result: ResultadoReconciliacao = { chave: ch50, statusExterno, statusInternoAntes: nota?.status }

  if (!nota) return result

  // Mapear para nosso código interno (status)
  const desired = statusExterno === 'cancelada' ? '2'
                : statusExterno === 'autorizada' ? '1'
                : undefined

  if (desired && desired !== nota.status) {
    const data: any = { status: desired, statusNfse: desired === '2' ? 'cancelada' : (desired === '1' ? 'autorizada' : undefined) }
    if (desired === '2') data.dataCancelamento = new Date()
    await prisma.notafiscal.update({ where: { id: nota.id }, data })
    console.log('[Reconcile][UPDATE]', { id: nota.id, to: data })
    result.atualizado = true
  } else if (!desired) {
    // Heurística complementar: se externo 'desconhecido', verificar registros NFSe auxiliares
    try {
      const aux = await (prisma as any).nFSe.findFirst({ where: { chaveAcesso: { contains: ch50 } }, select: { rawResponse: true, xmlNfse: true } })
      const txt = String(aux?.rawResponse || aux?.xmlNfse || '')
      if (txt) {
        const low = txt.toLowerCase()
        if (low.includes('<e101101') || low.includes('cancel')) {
          const data: any = { status: '2', statusNfse: 'cancelada', dataCancelamento: new Date() }
          await prisma.notafiscal.update({ where: { id: nota.id }, data })
          console.log('[Reconcile][FALLBACK-DB][CANCEL]', { id: nota.id })
          result.statusExterno = 'cancelada'
          result.atualizado = true
        }
      }
    } catch {}
  }

  return result
}

/**
 * Reconciliar em lote: percorre notas candidatas e ajusta quando necessário.
 * Filtro padrão: notas com status '1' (autorizada) ou '3/5' (em espera/processando) e com chave de 50 dígitos.
 */
export async function reconciliarLote(opt: ConsultaExternaOptions & { limit?: number }): Promise<ResultadoReconciliacao[]> {
  const limit = opt.limit && opt.limit > 0 ? opt.limit : 100
  const candidatas = await prisma.notafiscal.findMany({
    where: {
      AND: [
        { OR: [ { status: '1' }, { status: '3' }, { status: '5' } ] },
        { chaveAcesso: { not: null } },
      ]
    },
    take: limit,
    select: { chaveAcesso: true }
  })

  const out: ResultadoReconciliacao[] = []
  for (const n of candidatas) {
    const chave = (n.chaveAcesso || '').replace(/\D+/g, '')
    if (chave.length !== 50) continue
    const r = await reconciliarStatusPorChave(chave, opt)
    out.push(r)
  }
  return out
}
