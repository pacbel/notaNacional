import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNFSeFields } from '@/lib/nfse-nacional/parse'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const numero_guia = body?.numero_guia

    if (numero_guia == null) {
      return NextResponse.json({ message: 'numero_guia é obrigatório' }, { status: 400 })
    }
    const numeroGuiaInt = Number(numero_guia)
    if (!Number.isInteger(numeroGuiaInt)) {
      return NextResponse.json({ message: 'numero_guia deve ser inteiro' }, { status: 400 })
    }

    const xmlNFSe = body?.xmlNFSe as string | undefined
    const parsed = parseNFSeFields(xmlNFSe)
    const nfseId = parsed.nfse_id ? String(parsed.nfse_id).trim() : null

    // Deriva chave se necessário (padrão BH: Id NFS + 50 dígitos)
    let chaveDerivada: string | null = null
    if (!parsed.chave_acesso && nfseId) {
      const m = nfseId.match(/^NFS(\d{50})$/)
      if (m && m[1]) chaveDerivada = m[1]
    }

    const data = {
      numeroGuia: numeroGuiaInt,
      status: body?.status != null ? Number(body.status) : 1,
      nfseId: nfseId,
      nNfse: (parsed.n_nfse || (body?.numero ? String(body.numero) : null))?.toString().trim() || null,
      codigoVerificacao: (parsed.codigo_verificacao || (body?.codigoVerificacao ? String(body.codigoVerificacao) : null))?.toString().trim() || null,
      chaveAcesso: (parsed.chave_acesso || (body?.chaveAcesso ? String(body.chaveAcesso) : null) || chaveDerivada)?.toString().trim() || null,
      urlNfse: body?.urlNfse || null,
      xmlNfse: xmlNFSe || null,
      nfseBase64Gzip: body?.nfseBase64Gzip ? Buffer.from(String(body.nfseBase64Gzip), 'base64') : null,
      rawResponse: typeof body?.rawResponse === 'string' ? body.rawResponse : (body?.rawResponse ? JSON.stringify(body.rawResponse) : null),
      ambiente: parsed.ambiente ?? (body?.extra?.ambiente ?? null),
      valorTotal: parsed.valor_total ?? (body?.extra?.valor_total ?? null),
      codigoServicoNac: parsed.cTribNac ?? (body?.extra?.codigo_servico_nac ?? null),
      codigoServicoMun: parsed.cTribMun ?? (body?.extra?.codigo_servico_mun ?? null),
      discriminacao: (parsed.discriminacao ?? (body?.extra?.discriminacao ?? null))?.toString().trim() || null,
      prestadorCnpj: (parsed.prestador_cnpj ?? (body?.extra?.prestador_cnpj ?? null))?.toString().trim() || null,
      tomadorCpfCnpj: (parsed.tomador_cpf_cnpj ?? (body?.extra?.tomador_cpf_cnpj ?? null))?.toString().trim() || null,
      tomadorEmail: body?.extra?.tomador_email ? String(body.extra.tomador_email).trim() : null,
      tomadorTelefone: body?.extra?.tomador_telefone ? String(body.extra.tomador_telefone).trim() : null,
      nDps: body?.extra?.n_dps ?? null,
      serie: body?.extra?.serie ?? null,
    } as const

    const result = await (prisma as any).nFSe.create({ data })

    return NextResponse.json({ ok: true, id: result?.id ?? null }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha ao salvar retorno', details: e?.message || String(e) }, { status: 500 })
  }
}
