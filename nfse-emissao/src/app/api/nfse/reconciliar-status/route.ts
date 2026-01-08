import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reconciliarLote, reconciliarStatusPorChave } from '@/lib/nfse-nacional/reconciliarStatus'

export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try { body = await req.json() } catch { body = {} }
    const ambiente = body?.ambiente ?? 2
    const certificateId = body?.certificateId
    const baseUrl = body?.baseUrl
    const chave = body?.chave
    const limit = body?.limit
    const notaIds = body?.notaIds
    const all = body?.all ?? true
    console.log('[ReconciliarStatus][IN]', { ambiente, certificateId: !!certificateId, baseUrl, chave, limit, notaIdsCount: Array.isArray(notaIds)? notaIds.length : 0, all })
    const ambienteEfetivo = ambiente === 1 ? 1 : 2
    const serverOrigin = new URL(req.url).origin

    async function pdfIndicaCancelamentoPorChave(ch: string): Promise<boolean> {
      try {
        const u = new URL(`${serverOrigin}/api/nfse/danfse`)
        u.searchParams.set('chave', ch)
        u.searchParams.set('ambiente', String(ambienteEfetivo))
        if (certificateId) u.searchParams.set('certificateId', certificateId)
        const r = await fetch(u.toString())
        if (!r.ok) return false
        const ab = await r.arrayBuffer()
        const buf = Buffer.from(ab)
        // Heurística: buscar token 'cancelad' em diferentes decodificações
        const sUtf8 = buf.toString('utf-8').toLowerCase()
        if (sUtf8.includes('cancelad')) return true
        const sLat1 = buf.toString('latin1').toLowerCase()
        if (sLat1.includes('cancelad')) return true
        return false
      } catch {
        return false
      }
    }

    async function marcarCanceladaLocal(ch: string): Promise<boolean> {
      try {
        const u = await prisma.notafiscal.updateMany({ where: { chaveAcesso: ch }, data: { status: '2', statusNfse: 'cancelada', dataCancelamento: new Date() } })
        if (u?.count) return true
        const nf = await prisma.notafiscal.findFirst({ where: { nfseXML: { contains: ch } }, select: { id: true } })
        if (nf?.id) {
          await prisma.notafiscal.update({ where: { id: nf.id }, data: { status: '2', statusNfse: 'cancelada', dataCancelamento: new Date() } })
          return true
        }
      } catch {}
      return false
    }

    if (chave) {
      console.log('[ReconciliarStatus][MODE] single-key')
      const r = await reconciliarStatusPorChave(String(chave), { ambiente: ambienteEfetivo, certificateId, baseUrl })
      if (!r.atualizado) {
        const ok = await pdfIndicaCancelamentoPorChave(String(chave))
        if (ok) {
          const up = await marcarCanceladaLocal(String(chave))
          if (up) { r.atualizado = true; r.statusExterno = 'cancelada' }
        }
      }
      console.log('[ReconciliarStatus][OUT][single]', r)
      return NextResponse.json({ success: true, data: [r] })
    }

    // Processar nota por nota via lista de IDs
    if (Array.isArray(notaIds) && notaIds.length) {
      console.log('[ReconciliarStatus][MODE] notaIds', { count: notaIds.length })
      const notas = await prisma.notafiscal.findMany({ where: { id: { in: notaIds } }, select: { id: true, chaveAcesso: true } })
      const out: any[] = []
      for (const n of notas) {
        const chave = String(n.chaveAcesso || '').replace(/\D+/g, '')
        if (chave.length !== 50) { out.push({ id: n.id, chave: n.chaveAcesso, skip: 'sem_chave_50' }); continue }
        const r = await reconciliarStatusPorChave(chave, { ambiente: ambienteEfetivo, certificateId, baseUrl })
        if (!r.atualizado) {
          const ok = await pdfIndicaCancelamentoPorChave(chave)
          if (ok) {
            const up = await marcarCanceladaLocal(chave)
            if (up) { r.atualizado = true; r.statusExterno = 'cancelada' }
          }
        }
        out.push({ id: n.id, ...r })
      }
      console.log('[ReconciliarStatus][OUT][notaIds]', { count: out.length })
      return NextResponse.json({ success: true, data: out })
    }

    // Processar todas as notas com chave de acesso (pode limitar)
    if (all) {
      const lim = limit && limit > 0 ? Number(limit) : 100
      console.log('[ReconciliarStatus][MODE] all-with-key', { limit: lim })
      const notas = await prisma.notafiscal.findMany({
        where: { chaveAcesso: { not: null } },
        take: lim,
        select: { id: true, chaveAcesso: true }
      })
      const out: any[] = []
      for (const n of notas) {
        const chave = String(n.chaveAcesso || '').replace(/\D+/g, '')
        if (chave.length !== 50) { out.push({ id: n.id, chave: n.chaveAcesso, skip: 'sem_chave_50' }); continue }
        const r = await reconciliarStatusPorChave(chave, { ambiente: ambienteEfetivo, certificateId, baseUrl })
        if (!r.atualizado) {
          const ok = await pdfIndicaCancelamentoPorChave(chave)
          if (ok) {
            const up = await marcarCanceladaLocal(chave)
            if (up) { r.atualizado = true; r.statusExterno = 'cancelada' }
          }
        }
        out.push({ id: n.id, ...r })
      }
      console.log('[ReconciliarStatus][OUT][all]', { count: out.length })
      return NextResponse.json({ success: true, data: out })
    }

    console.log('[ReconciliarStatus][MODE] batch', { limit })
    const data = await reconciliarLote({ ambiente: ambienteEfetivo, certificateId, baseUrl, limit })
    // Fallback por PDF para itens que não atualizaram
    for (const r of data) {
      if (!r.atualizado && r.chave?.length === 50) {
        const ok = await pdfIndicaCancelamentoPorChave(r.chave)
        if (ok) {
          const up = await marcarCanceladaLocal(r.chave)
          if (up) { r.atualizado = true; r.statusExterno = 'cancelada' }
        }
      }
    }
    console.log('[ReconciliarStatus][OUT][batch]', { count: data?.length })
    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('[ReconciliarStatus][ERR]', e?.message || String(e), e?.stack)
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 })
  }
}
