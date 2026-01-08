import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface EnviarEmailBody {
  para: string | string[]
  assunto?: string
  mensagemHtml?: string
  // Anexos diretos
  xmlConteudo?: string // XML em texto
  xmlNome?: string
  pdfBase64?: string // PDF em base64 (sem prefixo data:)
  pdfNome?: string
  // Alternativa: baixar PDF pela chave
  chaveAcesso?: string
  ambiente?: number // 1=Prod, 2=Homolog
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as EnviarEmailBody

    const toList = Array.isArray(body.para) ? body.para : String(body.para || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!toList.length) {
      return NextResponse.json({ error: 'Informe destinatário(s) em "para"' }, { status: 400 })
    }

    const host = process.env.NEXT_PUBLIC_SMTP_HOST
    const port = process.env.NEXT_PUBLIC_SMTP_PORT ? Number(process.env.NEXT_PUBLIC_SMTP_PORT) : 587
    const secure = String(process.env.NEXT_PUBLIC_SMTP_SECURE || 'false').toLowerCase() === 'true'
    const user = process.env.NEXT_PUBLIC_SMTP_USER
    const pass = process.env.NEXT_PUBLIC_SMTP_PASS
    const fromEmail = process.env.NEXT_PUBLIC_SMTP_FROM || user
    const fromName = process.env.NEXT_PUBLIC_SMTP_FROM_NAME || 'NFSe Sistema'

    if (!host || !user || !pass) {
      return NextResponse.json({ error: 'Configuração SMTP ausente. Verifique variáveis: NEXT_PUBLIC_SMTP_HOST/USER/PASS' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })

    const attachments: any[] = []

    // Anexar XML (texto)
    if (body.xmlConteudo) {
      attachments.push({ filename: body.xmlNome || 'nfse.xml', content: body.xmlConteudo, contentType: 'application/xml; charset=utf-8' })
    }

    // Anexar PDF a partir de base64
    if (body.pdfBase64) {
      attachments.push({ filename: body.pdfNome || 'danfse.pdf', content: Buffer.from(body.pdfBase64, 'base64'), contentType: 'application/pdf' })
    }

    // Alternativa: baixar PDF pela chave via endpoint local
    if (!body.pdfBase64 && body.chaveAcesso) {
      const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/nfse/danfse`)
      url.searchParams.set('chave', body.chaveAcesso)
      url.searchParams.set('ambiente', String(body.ambiente || 2))
      const r = await fetch(url.toString())
      if (r.ok) {
        const arrayBuf = await r.arrayBuffer()
        attachments.push({ filename: body.pdfNome || 'danfse.pdf', content: Buffer.from(arrayBuf), contentType: 'application/pdf' })
      }
    }

    const subject = body.assunto || 'Documento de NFS-e'
    const html = body.mensagemHtml || '<p>Segue em anexo a NFS-e.</p>'

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: toList.join(', '),
      subject,
      html,
      attachments,
    })

    return NextResponse.json({ ok: true, messageId: info.messageId })
  } catch (e: any) {
    return NextResponse.json({ error: 'Falha ao enviar e-mail', details: e?.message || String(e) }, { status: 500 })
  }
}
