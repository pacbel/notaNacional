import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da nota fiscal não fornecido' },
        { status: 400 }
      );
    }
    
    const notaFiscal = await prisma.notafiscal.findUnique({
      where: { id },
      include: {
        prestador: true,
        tomador: true,
        itemnotafiscal: {
          include: {
            servico: true
          }
        }
      }
    });

    if (!notaFiscal) {
      throw new Error('Nota fiscal não encontrada');
    }

    if (!notaFiscal.prestador) {
      throw new Error('Prestador não encontrado');
    }

    if (!notaFiscal.tomador) {
      throw new Error('Tomador não encontrado');
    }

    if (!notaFiscal.itemnotafiscal || notaFiscal.itemnotafiscal.length === 0) {
      throw new Error('Itens da nota fiscal não encontrados');
    }

    // Obter o numeroRpsAtual do prestador (sem incrementar)
    const prestador = await prisma.prestador.findUnique({
      where: { id: notaFiscal.prestador.id },
      select: {
        numeroRpsAtual: true,
        razaoSocial: true,
        cnpj: true
      }
    });
    
    if (!prestador) {
      throw new Error('Prestador não encontrado');
    }
    
    // Usar o numeroRpsAtual atual (será incrementado apenas após autorização)
    const numeroRpsAtual = prestador.numeroRpsAtual;
    
    // Registrar a data e hora atual que será usada na geração do JSON
    const dataHoraAtual = new Date();
    
    // Ajustar para o fuso horário local (Brasil -3)
    const dataHoraLocal = new Date(dataHoraAtual.getTime() - (3 * 60 * 60 * 1000));
    
    // Formatar a data no formato ISO mas com o fuso horário -03:00
    const dataFormatada = dataHoraLocal.toISOString().replace('Z', '-03:00');
    
    // Preparar o JSON para a NFSe
    const jsonNfse = {
      ambiente: notaFiscal.ambiente,
      LoteRps: {
        Id: 'lote',
        versao: '1.00',
        NumeroLote: numeroRpsAtual.toString(),
        Cnpj: notaFiscal.prestador.cnpj,
        InscricaoMunicipal: notaFiscal.prestador.inscricaoMunicipal,
        QuantidadeRps: 1,
        ListaRps: {
          Rps: {
            Id: numeroRpsAtual.toString(),
            InfRps: {
              Id: `rps:${numeroRpsAtual.toString()}`,
              IdentificacaoRps: {
                Numero: numeroRpsAtual.toString(),
                Serie: notaFiscal.serie,
                Tipo: '1'
              },
              DataEmissao: dataFormatada,
              NaturezaOperacao: notaFiscal.naturezaOperacao.toString(),
              OptanteSimplesNacional: notaFiscal.optanteSimplesNacional ? '1' : '2',
              IncentivadorCultural: notaFiscal.incentivadorCultural ? '1' : '2',
              Status: '1',
              Servico: {
                Valores: {
                  ValorServicos: notaFiscal.itemnotafiscal[0].valorTotal.toFixed(2),
                  BaseCalculo: notaFiscal.itemnotafiscal[0].valorTotal.toFixed(2),
                  ValorDeducoes: '0',
                  ValorPis: '0',
                  ValorCofins: '0',
                  ValorInss: '0',
                  ValorIr: '0',
                  ValorCsll: '0',
                  IssRetido: '2',
                  OutrasRetencoes: '0',
                  Aliquota: (notaFiscal.itemnotafiscal[0].servico.aliquota / 100).toFixed(3),
                  DescontoIncondicionado: '0',
                  DescontoCondicionado: '0'
                },
                ItemListaServico: notaFiscal.itemnotafiscal[0].servico.itemListaServico,
                CodigoTributacaoMunicipio: notaFiscal.itemnotafiscal[0].servico.codigoTributacao,
                Discriminacao: notaFiscal.itemnotafiscal[0].discriminacao,
                CodigoMunicipio: notaFiscal.prestador.codigoMunicipio
              },
              Prestador: {
                Cnpj: notaFiscal.prestador.cnpj,
                InscricaoMunicipal: notaFiscal.prestador.inscricaoMunicipal
              },
              Tomador: {
                IdentificacaoTomador: {
                  CpfCnpj: {
                    [notaFiscal.tomador.tipo === 'pf' ? 'Cpf' : 'Cnpj']: notaFiscal.tomador.cpfCnpj
                  },
                  InscricaoMunicipal: notaFiscal.tomador.inscricaoMunicipal || ''
                },
                RazaoSocial: notaFiscal.tomador.razaoSocial,
                Endereco: {
                  Endereco: notaFiscal.tomador.endereco,
                  Numero: notaFiscal.tomador.numero,
                  Complemento: notaFiscal.tomador.complemento || '',
                  Bairro: notaFiscal.tomador.bairro,
                  CodigoMunicipio: notaFiscal.tomador.codigoMunicipio,
                  Uf: notaFiscal.tomador.uf,
                  Cep: notaFiscal.tomador.cep
                },
                Contato: {
                  Telefone: notaFiscal.tomador.telefone || '',
                  Email: notaFiscal.tomador.email || ''
                }
              }
            }
          }
        }
      }
    };

    // Adiciona o id da nota fiscal para referência
    const resultado = {
      id: notaFiscal.id,
      ...jsonNfse
    };

    return NextResponse.json({ data: resultado });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar JSON da NFSe' },
      { status: 500 }
    );
  }
}