/**
 * Utilitário para processar o XML da NFSe
 */

/**
 * Interface para os dados extraídos do XML da NFSe
 */
export interface DadosNfse {
  numero: string;
  codigoVerificacao: string;
  dataEmissao: string;
  competencia: string;
  valorServicos: number;
  valorDeducoes: number;
  valorPis: number;
  valorCofins: number;
  valorInss: number;
  valorIr: number;
  valorCsll: number;
  issRetido: boolean;
  valorIss: number;
  outrasRetencoes: number;
  baseCalculo: number;
  aliquota: number;
  valorLiquidoNfse: number;
  descontoIncondicionado: number;
  descontoCondicionado: number;
  itemListaServico: string;
  codigoTributacaoMunicipio: string;
  discriminacao: string;
  codigoMunicipio: string;
  cnpjPrestador: string;
  inscricaoMunicipalPrestador: string;
  razaoSocialPrestador: string;
  nomeFantasiaPrestador: string;
  cnpjTomador: string;
  razaoSocialTomador: string;
  emailTomador: string;
  xmlCompleto: string;
}

/**
 * Extrai os dados do XML da NFSe
 * @param xmlString XML completo da NFSe
 * @returns Objeto com os dados extraídos do XML
 */
export function processarXmlNfse(xmlString: string): DadosNfse | null {
  try {
    // Verificar se o XML é válido
    if (!xmlString || !xmlString.includes('<CompNfse')) {
      console.error('[processarXmlNfse] XML inválido ou não contém a tag CompNfse');
      return null;
    }

    // Extrair os dados básicos da NFSe
    const numeroMatch = xmlString.match(/<Numero>([^<]+)<\/Numero>/);
    const codigoVerificacaoMatch = xmlString.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/);
    const dataEmissaoMatch = xmlString.match(/<DataEmissao>([^<]+)<\/DataEmissao>/);
    const competenciaMatch = xmlString.match(/<Competencia>([^<]+)<\/Competencia>/);
    
    // Extrair os valores
    const valorServicosMatch = xmlString.match(/<ValorServicos>([^<]+)<\/ValorServicos>/);
    const valorDeducoesMatch = xmlString.match(/<ValorDeducoes>([^<]+)<\/ValorDeducoes>/);
    const valorPisMatch = xmlString.match(/<ValorPis>([^<]+)<\/ValorPis>/);
    const valorCofinsMatch = xmlString.match(/<ValorCofins>([^<]+)<\/ValorCofins>/);
    const valorInssMatch = xmlString.match(/<ValorInss>([^<]+)<\/ValorInss>/);
    const valorIrMatch = xmlString.match(/<ValorIr>([^<]+)<\/ValorIr>/);
    const valorCsllMatch = xmlString.match(/<ValorCsll>([^<]+)<\/ValorCsll>/);
    const issRetidoMatch = xmlString.match(/<IssRetido>([^<]+)<\/IssRetido>/);
    const valorIssMatch = xmlString.match(/<ValorIss>([^<]+)<\/ValorIss>/);
    const outrasRetencoesMatch = xmlString.match(/<OutrasRetencoes>([^<]+)<\/OutrasRetencoes>/);
    const baseCalculoMatch = xmlString.match(/<BaseCalculo>([^<]+)<\/BaseCalculo>/);
    const aliquotaMatch = xmlString.match(/<Aliquota>([^<]+)<\/Aliquota>/);
    const valorLiquidoNfseMatch = xmlString.match(/<ValorLiquidoNfse>([^<]+)<\/ValorLiquidoNfse>/);
    const descontoIncondicionadoMatch = xmlString.match(/<DescontoIncondicionado>([^<]+)<\/DescontoIncondicionado>/);
    const descontoCondicionadoMatch = xmlString.match(/<DescontoCondicionado>([^<]+)<\/DescontoCondicionado>/);
    
    // Extrair dados do serviço
    const itemListaServicoMatch = xmlString.match(/<ItemListaServico>([^<]+)<\/ItemListaServico>/);
    const codigoTributacaoMunicipioMatch = xmlString.match(/<CodigoTributacaoMunicipio>([^<]+)<\/CodigoTributacaoMunicipio>/);
    const discriminacaoMatch = xmlString.match(/<Discriminacao>([^<]+)<\/Discriminacao>/);
    const codigoMunicipioMatch = xmlString.match(/<CodigoMunicipio>([^<]+)<\/CodigoMunicipio>/);
    
    // Extrair dados do prestador
    const cnpjPrestadorMatch = xmlString.match(/<IdentificacaoPrestador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/);
    const inscricaoMunicipalPrestadorMatch = xmlString.match(/<IdentificacaoPrestador>[\s\S]*?<InscricaoMunicipal>([^<]+)<\/InscricaoMunicipal>/);
    const razaoSocialPrestadorMatch = xmlString.match(/<PrestadorServico>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/);
    const nomeFantasiaPrestadorMatch = xmlString.match(/<PrestadorServico>[\s\S]*?<NomeFantasia>([^<]+)<\/NomeFantasia>/);
    
    // Extrair dados do tomador
    const cnpjTomadorMatch = xmlString.match(/<IdentificacaoTomador>[\s\S]*?<Cnpj>([^<]+)<\/Cnpj>/);
    const razaoSocialTomadorMatch = xmlString.match(/<TomadorServico>[\s\S]*?<RazaoSocial>([^<]+)<\/RazaoSocial>/);
    const emailTomadorMatch = xmlString.match(/<Contato>[\s\S]*?<Email>([^<]+)<\/Email>/);

    // Verificar se os dados essenciais foram encontrados
    if (!numeroMatch || !codigoVerificacaoMatch || !dataEmissaoMatch) {
      console.error('[processarXmlNfse] Dados essenciais não encontrados no XML');
      return null;
    }

    // Converter os valores para os tipos corretos
    const parseFloatOrZero = (value: string | null | undefined) => {
      if (!value) return 0;
      const parsed = parseFloat(value.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    };

    // Montar o objeto com os dados extraídos
    const dadosNfse: DadosNfse = {
      numero: numeroMatch[1],
      codigoVerificacao: codigoVerificacaoMatch ? codigoVerificacaoMatch[1] : '',
      dataEmissao: dataEmissaoMatch[1],
      competencia: competenciaMatch ? competenciaMatch[1] : '',
      valorServicos: parseFloatOrZero(valorServicosMatch ? valorServicosMatch[1] : '0'),
      valorDeducoes: parseFloatOrZero(valorDeducoesMatch ? valorDeducoesMatch[1] : '0'),
      valorPis: parseFloatOrZero(valorPisMatch ? valorPisMatch[1] : '0'),
      valorCofins: parseFloatOrZero(valorCofinsMatch ? valorCofinsMatch[1] : '0'),
      valorInss: parseFloatOrZero(valorInssMatch ? valorInssMatch[1] : '0'),
      valorIr: parseFloatOrZero(valorIrMatch ? valorIrMatch[1] : '0'),
      valorCsll: parseFloatOrZero(valorCsllMatch ? valorCsllMatch[1] : '0'),
      issRetido: issRetidoMatch ? issRetidoMatch[1] === '1' : false,
      valorIss: parseFloatOrZero(valorIssMatch ? valorIssMatch[1] : '0'),
      outrasRetencoes: parseFloatOrZero(outrasRetencoesMatch ? outrasRetencoesMatch[1] : '0'),
      baseCalculo: parseFloatOrZero(baseCalculoMatch ? baseCalculoMatch[1] : '0'),
      aliquota: parseFloatOrZero(aliquotaMatch ? aliquotaMatch[1] : '0'),
      valorLiquidoNfse: parseFloatOrZero(valorLiquidoNfseMatch ? valorLiquidoNfseMatch[1] : '0'),
      descontoIncondicionado: parseFloatOrZero(descontoIncondicionadoMatch ? descontoIncondicionadoMatch[1] : '0'),
      descontoCondicionado: parseFloatOrZero(descontoCondicionadoMatch ? descontoCondicionadoMatch[1] : '0'),
      itemListaServico: itemListaServicoMatch ? itemListaServicoMatch[1] : '',
      codigoTributacaoMunicipio: codigoTributacaoMunicipioMatch ? codigoTributacaoMunicipioMatch[1] : '',
      discriminacao: discriminacaoMatch ? discriminacaoMatch[1] : '',
      codigoMunicipio: codigoMunicipioMatch ? codigoMunicipioMatch[1] : '',
      cnpjPrestador: cnpjPrestadorMatch ? cnpjPrestadorMatch[1] : '',
      inscricaoMunicipalPrestador: inscricaoMunicipalPrestadorMatch ? inscricaoMunicipalPrestadorMatch[1] : '',
      razaoSocialPrestador: razaoSocialPrestadorMatch ? razaoSocialPrestadorMatch[1] : '',
      nomeFantasiaPrestador: nomeFantasiaPrestadorMatch ? nomeFantasiaPrestadorMatch[1] : '',
      cnpjTomador: cnpjTomadorMatch ? cnpjTomadorMatch[1] : '',
      razaoSocialTomador: razaoSocialTomadorMatch ? razaoSocialTomadorMatch[1] : '',
      emailTomador: emailTomadorMatch ? emailTomadorMatch[1] : '',
      xmlCompleto: xmlString
    };

    return dadosNfse;
  } catch (error) {
    console.error('[processarXmlNfse] Erro ao processar XML da NFSe:', error);
    return null;
  }
}
