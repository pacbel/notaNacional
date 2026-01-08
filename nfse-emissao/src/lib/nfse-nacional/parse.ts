// UTF-8
// Utilitário local para extrair campos comuns do XML da NFS-e Nacional
// Retorna apenas os campos hoje utilizados por /api/nfse/salvar-retorno

export type ParsedNFSeFields = {
  nfse_id?: string | null;
  n_nfse?: string | null;
  codigo_verificacao?: string | null;
  chave_acesso?: string | null;
  ambiente?: number | null;
  valor_total?: number | null;
  cTribNac?: string | null;
  cTribMun?: string | null;
  discriminacao?: string | null;
  prestador_cnpj?: string | null;
  tomador_cpf_cnpj?: string | null;
};

export function parseNFSeFields(xml?: string | null): ParsedNFSeFields {
  const out: ParsedNFSeFields = {};
  const s = (xml || '').toString();
  if (!s) return out;

  // nfse_id: atributo Id="NFS<50>"
  const idM = s.match(/Id\s*=\s*"(NFS\d{50})"/i);
  out.nfse_id = idM?.[1] || null;

  // chave_acesso prioritária (pode estar em <chaveAcesso> ou derivada do Id)
  const chaveM = s.match(/<\s*chaveAcesso\s*>\s*(\d{50})\s*<\s*\/\s*chaveAcesso\s*>/i);
  out.chave_acesso = (chaveM?.[1] || (idM ? idM[1].replace(/^NFS/, '') : '')) || null;

  // número da NFS-e
  const nM = s.match(/<\s*nNFSe\s*>\s*(\d+)\s*<\s*\/\s*nNFSe\s*>/i) || s.match(/<\s*numeroNfse\s*>\s*(\d+)\s*<\s*\/\s*numeroNfse\s*>/i);
  out.n_nfse = nM?.[1] || null;

  // código de verificação
  const verM = s.match(/<\s*codVerif\s*>\s*([A-Za-z0-9\-_.]+)\s*<\s*\/\s*codVerif\s*>/i) || s.match(/<\s*codigoVerificacao\s*>\s*([A-Za-z0-9\-_.]+)\s*<\s*\/\s*codigoVerificacao\s*>/i);
  out.codigo_verificacao = verM?.[1] || null;

  // ambiente (1 produção, 2 homologação) se presente
  const ambM = s.match(/<\s*tpAmb\s*>\s*([12])\s*<\s*\/\s*tpAmb\s*>/i);
  out.ambiente = ambM ? Number(ambM[1]) : null;

  // valor total
  const vM = s.match(/<\s*vNFSe\s*>\s*([0-9]+(?:\.[0-9]{1,2})?)\s*<\s*\/\s*vNFSe\s*>/i) || s.match(/<\s*valorTotal\s*>\s*([0-9]+(?:\.[0-9]{1,2})?)\s*<\s*\/\s*valorTotal\s*>/i);
  out.valor_total = vM ? Number(vM[1]) : null;

  // códigos de serviço
  const ctnM = s.match(/<\s*cTribNac\s*>\s*([0-9]{6})\s*<\s*\/\s*cTribNac\s*>/i);
  out.cTribNac = ctnM?.[1] || null;
  const ctmM = s.match(/<\s*cTribMun\s*>\s*([0-9]{3})\s*<\s*\/\s*cTribMun\s*>/i);
  out.cTribMun = ctmM?.[1] || null;

  // discriminacao
  const discM = s.match(/<\s*xDescServ\s*>\s*([\s\S]*?)\s*<\s*\/\s*xDescServ\s*>/i);
  out.discriminacao = discM?.[1]?.trim() || null;

  // CNPJ/CPF
  const prestCnpjM = s.match(/<\s*prest\s*>[\s\S]*?<\s*CNPJ\s*>\s*(\d{14})\s*<\s*\/\s*CNPJ\s*>/i);
  out.prestador_cnpj = prestCnpjM?.[1] || null;
  const tomaDocM = s.match(/<\s*toma\s*>[\s\S]*?<\s*(?:CNPJ|CPF)\s*>\s*(\d{11,14})\s*<\s*\/\s*(?:CNPJ|CPF)\s*>/i);
  out.tomador_cpf_cnpj = tomaDocM?.[1] || null;

  return out;
}
