import { toast } from 'react-toastify';
import { TransmitirNotaResponse } from './types';
import { montarDPSXMLCliente, type DPSClientInput } from '@/lib/nfse-nacional/dpsBuilderClient';
import { assinarXml, emitirNFSe } from '@/lib/nfse-nacional/localClient';
import { validarDPSXSD } from '@/lib/nfse-nacional/xsdValidate';
import { normalizeSignaturePlacement } from '@/lib/nfse-nacional/xmlUtils';

export async function transmitirNota(notaId: string, certificateIdParam?: string): Promise<TransmitirNotaResponse> {
  try {
    // 1) Carrega a nota completa para montar a DPS
    const notaResp = await fetch(`/api/nfse/${notaId}`);
    if (!notaResp.ok) {
      let detalhe = '';
      try {
        const contentType = notaResp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const j = await notaResp.json().catch(() => null as any);
          detalhe = j?.details || j?.error || JSON.stringify(j);
        } else {
          detalhe = await notaResp.text().catch(() => '');
        }
      } catch {}
      const baseMsg = 'Não foi possível buscar a nota fiscal';
      const msg = detalhe ? `${baseMsg}: ${String(detalhe).slice(0, 500)}` : baseMsg;
      console.error('[transmitirNota] Falha ao buscar nota:', notaId, 'status=', notaResp.status, 'detalhe=', detalhe);
      return { success: false, errors: [msg] };
    }
    const nota = await notaResp.json();

    if (!nota?.prestador || !nota?.tomador || !Array.isArray(nota?.itemnotafiscal) || nota.itemnotafiscal.length === 0) {
      return { success: false, errors: ['Dados insuficientes para montar a DPS'] };
    }

    const item0 = nota.itemnotafiscal[0];

    // 2) Montar entrada do builder de DPS
    const ambienteEfetivo: 1 | 2 = (nota?.prestador?.ambiente === 1 || nota?.prestador?.ambiente === 2)
      ? nota.prestador.ambiente
      : ((nota.ambiente === 1 || nota.ambiente === 2) ? nota.ambiente : 2);

    // 2) Determinar códigos de tributação
    // Prioridade: 1) código nacional digitado no Prestador (6 dígitos); 2) itemListaServico (4->IISS00 ou 6 dígitos)
    const codigoTribNacFromDigitado = String((nota?.prestador as any)?.codigoTribNacional || '').trim();
    const codigoTribNacFromPrestItem = String((nota?.prestador as any)?.itemListaServico || '').trim();
    const codigoTribNacFromItemNota = String(item0?.servico?.itemListaServico || '').trim();
    const normalizeToNacional = (v: string) => {
      const d = (v || '').replace(/\D+/g, '');
      if (d.length === 6) return d;
      if (d.length === 4) return `${d}00`;
      return '';
    };
    const ctnFromDigitadoNorm = (() => {
      const d = (codigoTribNacFromDigitado || '').replace(/\D+/g, '');
      return d.length === 6 ? d : '';
    })();
    const ctnFromPrestItemNorm = normalizeToNacional(codigoTribNacFromPrestItem);
    const ctnFromItemNotaNorm = normalizeToNacional(codigoTribNacFromItemNota);
    const codigoTribNacEfetivo = ctnFromDigitadoNorm || ctnFromPrestItemNorm || ctnFromItemNotaNorm;

    const codigoTribMunRaw = String((nota?.prestador as any)?.codigoTributacao || item0?.servico?.codigoTributacao || '').replace(/\D+/g, '');
    // Somente enviar cTribMun quando exatamente 3 dígitos (por regra do XSD)
    const codigoTribMunEfetivo = (codigoTribMunRaw.length === 3) ? codigoTribMunRaw : undefined;

    // Exigibilidade/tributação ISSQN -> mapear para códigos do DPS
    // tribISSQN opções válidas: 1 Tributado no município, 2 Tributado fora do município, 3 Isento, 4 Imune, 5/6 Suspensa
    // Mapeamento a partir de exigibilidadeIss (cadastro):
    // 2 (Tributado no Município) -> 1
    // 3 (Isento) -> 3
    // 4 (Imune) -> 4
    // Outros -> 1 (padrão)
    const exigIss = (nota?.prestador as any)?.exigibilidadeIss;
    const tribISSQNEfetivo = ((): 1|2|3|4|5|6 => {
      if (exigIss === 4) return 4; // Imune
      if (exigIss === 3) return 3; // Isento
      if (exigIss === 2) return 1; // Tributado no município
      return 1;
    })();

    // Retenção ISS diretamente do cadastro do emitente conforme manual pesquisado:
    // tpRetISSQN: 1=Não retido (prestador recolhe), 2=Retido pelo tomador, 3=Retido pelo intermediário
    const tpRetISSQNEfetivo: 1 | 2 | 3 = Number((nota?.prestador as any)?.tpRetIssqn ?? 1) as 1 | 2 | 3;

    // Totais de tributação (percentuais)
    const pFed = (nota?.prestador as any)?.valorTribFederal;
    const pEst = (nota?.prestador as any)?.valorTribEstadual;
    const pMun = (nota?.prestador as any)?.totalTribMunicipal;

    // Competência deve ser uma data (YYYY-MM-DD) não posterior a dhEmi.
    // Evitar uso de toISOString (UTC) que pode avançar um dia em fusos negativos.
    const dataEmissaoLocal = new Date(nota.dataEmissao);
    const competenciaLocal = `${dataEmissaoLocal.getFullYear()}-${String(dataEmissaoLocal.getMonth() + 1).padStart(2, '0')}-${String(dataEmissaoLocal.getDate()).padStart(2, '0')}`;

    const dpsInput: DPSClientInput = {
      numeroAtendimento: String(nota.numero || nota.id || ''),
      competencia: competenciaLocal,
      tpAmb: ambienteEfetivo,
      verAplicDPS: 'WEB-APP',
      prestador: {
        cnpj: String(nota.prestador.cnpj || ''),
        // Não enviar IM para evitar E0120 (envie apenas se política futura permitir)
        im: '',
        razao: String(nota.prestador.razaoSocial || ''),
        codigoMunicipio: String(nota.prestador.codigoMunicipio || ''),
        uf: String(nota.prestador.uf || ''),
        cep: String(nota.prestador.cep || ''),
        logradouro: String(nota.prestador.endereco || ''),
        numero: String(nota.prestador.numero || ''),
        complemento: String(nota.prestador.complemento || ''),
        bairro: String(nota.prestador.bairro || ''),
      },
      prestadorContato: { fone: String(nota.prestador.telefone || ''), email: String(nota.prestador.email || '') },
      // opSimpNac: 1 Não Optante; 2 MEI; 3 ME/EPP. Fallback do boolean legado: true->3, false->1
      prestadorRegTrib: { 
        opSimpNac: (([1,2,3] as number[]).includes(Number((nota?.prestador as any)?.opSimpNac)) 
          ? Number((nota?.prestador as any)?.opSimpNac) as 1|2|3 
          : ((nota?.prestador?.optanteSimplesNacional ? 3 : 1) as 1|2|3)),
        regEspTrib: (nota.prestador.regimeEspecialTributacao ? 1 : 0) as 0 | 1 
      },
      serie: String(nota.prestador.serie || '1'),
      nDPS: String(nota.prestador.numeroRpsAtual),
      tomador: {
        cpfCnpj: String(nota.tomador.cpfCnpj || ''),
        im: String(nota.tomador.inscricaoMunicipal || ''),
        razaoSocial: String(nota.tomador.razaoSocial || ''),
        email: String(nota.tomador.email || ''),
        telefone: String(nota.tomador.telefone || ''),
        endereco: {
          logradouro: String(nota.tomador.endereco || ''),
          numero: String(nota.tomador.numero || ''),
          complemento: String(nota.tomador.complemento || ''),
          bairro: String(nota.tomador.bairro || ''),
          codigoMunicipio: String(nota.tomador.codigoMunicipio || ''),
          uf: String(nota.tomador.uf || ''),
          cep: String(nota.tomador.cep || ''),
        },
      },
      servico: {
        codigoTribNac: String(codigoTribNacEfetivo || ''),
        codigoTribMun: (typeof codigoTribMunEfetivo !== 'undefined') ? codigoTribMunEfetivo : undefined,
        discriminacao: String((item0?.servico?.descricao ?? item0?.discriminacao) || ''),
        valor: Number(item0?.valorTotal || nota.valorServicos || 0),
        aliquota: Number((nota?.prestador as any)?.aliquota ?? (item0?.servico?.aliquota ? item0.servico.aliquota / 100 : 0)),
      },
      locPrestacaoCodigo: String(nota?.codigoMunicipioPrestacao || nota?.prestador?.codigoMunicipio || ''),
      infoComplTemplate: 'Atendimento {{numeroAtendimento}}',
      tributacao: {
        tribISSQN: tribISSQNEfetivo as 1|2|3|4|5|6,
        tpRetISSQN: tpRetISSQNEfetivo,
        pTotTribFed: (typeof pFed === 'number') ? pFed.toFixed(2) : undefined,
        pTotTribEst: (typeof pEst === 'number') ? pEst.toFixed(2) : undefined,
        pTotTribMun: (typeof pMun === 'number') ? pMun.toFixed(2) : undefined,
        // tpImunidade será adicionado abaixo, condicionalmente
      },
    };

    // Somente incluir tpImunidade quando Imune
    const tpImunPrest = Number((nota?.prestador as any)?.tipoImunidade ?? 0);
    if (tribISSQNEfetivo === 2 && tpImunPrest > 0) {
      (dpsInput.tributacao as any).tpImunidade = tpImunPrest as 1|2|3;
    }

    // Logs de depuração do payload DPS montado
    console.log('[transmitirNota] cTribNac fontes:', {
      fromPrestNacionalDigitado: codigoTribNacFromDigitado,
      fromPrestItem: codigoTribNacFromPrestItem,
      fromItemNota: codigoTribNacFromItemNota,
      chosen: dpsInput.servico.codigoTribNac,
    });
    console.log('[transmitirNota] DPSInput.servico:', dpsInput.servico);
    console.log('[transmitirNota] DPSInput.prestadorRegTrib (mapeado):', {
      opSimpNac_source: (nota?.prestador as any)?.opSimpNac,
      optanteSimplesNacional_legacy: !!(nota?.prestador?.optanteSimplesNacional),
      opSimpNac: dpsInput.prestadorRegTrib?.opSimpNac,
      regEspTrib: dpsInput.prestadorRegTrib?.regEspTrib,
    });
    console.log('[transmitirNota] DPSInput.tributacao (mapeado):', {
      exigIss: exigIss,
      tribISSQN: dpsInput.tributacao?.tribISSQN,
      tpImunidade: (dpsInput.tributacao as any)?.tpImunidade,
      tpRetISSQN: dpsInput.tributacao?.tpRetISSQN,
      aliquotaPercent: (dpsInput.servico.aliquota ?? 0) * 100,
    });

    // 3) Montar XML DPS, assinar e normalizar assinatura
    const xmlDps = montarDPSXMLCliente(dpsInput);
    console.log('[transmitirNota] DPS XML (raw):\n', xmlDps);
    // Aviso de configuração do serviço local
    const localApiBase = process.env.NEXT_PUBLIC_NFSE_LOCAL_URL || ''
    if (!localApiBase) {
      toast.warning('Serviço local NFSe não configurado (NEXT_PUBLIC_NFSE_LOCAL_URL). Usando padrão https://localhost:5179.');
    }
    const certFromStorage = (typeof window !== 'undefined') ? (localStorage.getItem('nfse_cert_thumbprint') || '') : '';
    const certificateId = certificateIdParam || certFromStorage || process.env.NEXT_PUBLIC_CERTIFICATE_ID || '';
    if (!certificateId) {
      return { success: false, errors: ['certificateId não configurado. Defina NEXT_PUBLIC_CERTIFICATE_ID ou informe no chamado.'] };
    }
    const xmlAssinadoRaw = await assinarXml(xmlDps, 'infDPS', certificateId);
    const xmlAssinado = normalizeSignaturePlacement(xmlAssinadoRaw);
    console.log('[transmitirNota] DPS XML (signed length):', xmlAssinado?.length ?? 0);

    // 3.1) Validar XSD automaticamente (não bloquear se serviço indisponível, mas bloquear se retornar erros)
    try {
      const xsdResult = await validarDPSXSD(xmlAssinado, { versao: '1.00.02' })
      if (xsdResult?.warnings?.length) {
        console.warn('[transmitirNota] Avisos da validação XSD:', xsdResult.warnings)
      }
      if (!xsdResult?.ok) {
        console.error('[transmitirNota] Erros de XSD detectados:', xsdResult?.errors)
        return { success: false, errors: xsdResult?.errors || ['Falha na validação XSD do DPS.'] }
      }
    } catch (e: any) {
      console.warn('[transmitirNota] Falha inesperada ao validar XSD. Prosseguindo.', e?.message || String(e))
    }

    // 4) Emitir na API local
    type EmissaoResp = {
      numero_guia?: number;
      status?: number;
      url_nfse?: string;
      xmlNFSe?: string;
      nfse_base64_gzip?: string;
      [k: string]: unknown;
    };
    const payloadEnvio = { xmlAssinado, certificateId, ambiente: dpsInput.tpAmb!, cnpjEmitente: dpsInput.prestador.cnpj };
    console.log('[transmitirNota] Enviando para API Local /nfse/emitir com:', {
      ambiente: payloadEnvio.ambiente,
      cnpjEmitente: payloadEnvio.cnpjEmitente,
      xmlAssinadoPreview: xmlAssinado?.slice(0, 200) + '...'
    });
    const emitirResp = await emitirNFSe(payloadEnvio) as EmissaoResp;
    // 5) Novo modelo: autorizar NFSe e incrementar RPS no backend
    try {
      const authResp = await fetch('/api/nfse/autoriza-nfse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notaFiscalId: notaId, retornoEmissao: emitirResp }),
      })
      if (!authResp.ok) {
        const errText = await authResp.text().catch(() => '')
        throw new Error(errText || 'Falha ao confirmar autorização da NFS-e no servidor')
      }
    } catch (e: any) {
      const msg = e?.message || 'Falha ao confirmar autorização da NFS-e'
      toast.error(msg)
      return { success: false, errors: [msg] }
    }

    // Sucesso geral
    toast.success('NFS-e emitida e autorizada com sucesso')
    return { success: true, message: 'Emitida e autorizada pela API local' } as TransmitirNotaResponse;
  } catch (error: unknown) {
    const msg = (error as Error)?.message || 'Falha ao transmitir NFS-e via API local';
    toast.error(msg);
    return { success: false, errors: [msg] };
  }
}
