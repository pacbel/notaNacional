export function normalizeSignaturePlacement(xml: string): string {
  // Remover BOM e normalizar quebras de linha
  if (typeof xml !== 'string') return ''
  let cleaned = xml.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')

  // Se não houver infDPS ou DPS, apenas retorna normalizado
  if (!/<\/?infDPS\b/.test(cleaned) || !/<\/?DPS\b/.test(cleaned)) return cleaned

  // Já está correto se Signature estiver imediatamente após </infDPS>
  // Ainda assim, vamos garantir que não exista uma segunda assinatura dentro de infDPS

  // Capturar a assinatura (ds:Signature ou Signature) em qualquer namespace
  // Preferimos mover apenas a primeira assinatura encontrada DENTRO de infDPS
  const infOpen = cleaned.indexOf('<infDPS')
  const infClose = cleaned.indexOf('</infDPS>')
  if (infOpen === -1 || infClose === -1) return cleaned

  // Localizar assinaturas possíveis dentro de infDPS
  const signatureRegexes = [
    /<ds:Signature[\s\S]*?<\/ds:Signature>/g,
    /<Signature[\s\S]*?<\/Signature>/g,
  ]

  let moved = false
  let signatureBlock = ''
  for (const rx of signatureRegexes) {
    rx.lastIndex = 0
    const segment = cleaned.slice(infOpen, infClose)
    const match = rx.exec(segment)
    if (match) {
      signatureBlock = match[0]
      // Remover assinatura de dentro de infDPS
      const before = cleaned.slice(0, infOpen)
      const middle = segment.replace(signatureBlock, '')
      const after = cleaned.slice(infClose)
      cleaned = before + middle + after
      moved = true
      break
    }
  }

  // Se movemos a assinatura, inserir após </infDPS> e antes do fechamento de </DPS>
  if (moved && signatureBlock) {
    const newInfClose = cleaned.indexOf('</infDPS>')
    if (newInfClose !== -1) {
      const insertPos = newInfClose + '</infDPS>'.length
      cleaned = cleaned.slice(0, insertPos) + '\n' + signatureBlock + cleaned.slice(insertPos)
    }

    // Garantir que o elemento raiz DPS tenha xmlns:ds quando a assinatura usar o prefixo ds
    if (/^<ds:Signature\b/.test(signatureBlock) && !/xmlns:ds=\"http:\/\/www\.w3\.org\/2000\/09\/xmldsig#\"/.test(cleaned)) {
      // Adicionar xmlns:ds ao elemento <DPS ...>
      cleaned = cleaned.replace(
        /<DPS(\s[^>]*)?>/,
        (m) => {
          if (m.includes('xmlns:ds=')) return m
          const hasAttrs = /<DPS\s[^>]*>/.test(m)
          return hasAttrs
            ? m.replace('>', ' xmlns:ds="http://www.w3.org/2000/09/xmldsig#">')
            : '<DPS xmlns:ds="http://www.w3.org/2000/09/xmldsig#">'
        }
      )
    }
  }

  // Evitar duplicidade: se houver mais de uma assinatura igual, manter apenas a primeira após </infDPS>
  // (situação rara, mas alguns signers podem deixar uma cópia residual)
  const siblingSignaturePattern = /(<\/infDPS>)([\s\S]*?)(<ds:Signature[\s\S]*?<\/ds:Signature>|<Signature[\s\S]*?<\/Signature>)/
  const m = siblingSignaturePattern.exec(cleaned)
  if (m) {
    const afterInf = m[2]
    const sig = m[3]
    // Remover outras ocorrências posteriores idênticas
    const rest = cleaned.slice(m.index + m[1].length + afterInf.length)
    const dedupRest = rest.replace(new RegExp(escapeRegExp(sig), 'g'), '')
    cleaned = cleaned.slice(0, m.index + m[1].length) + afterInf + sig + dedupRest
  }

  return cleaned
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
