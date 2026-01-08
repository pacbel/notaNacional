#!/usr/bin/env node
// @ts-nocheck

// Definindo como módulo CommonJS
module.exports = {};

// Importações CommonJS
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');
const { randomUUID } = require('crypto');

// Instanciando o cliente Prisma
const prisma = new PrismaClient();

async function main() {
  console.log('==== INÍCIO DO SEED ====' );
  console.log('Iniciando seed unificado...');

  // ===== PRESTADORES =====
  const prestadorExistente = await prisma.prestador.findFirst({
    where: { cnpj: '05065736000161' }
  });

  let prestadorId;

  if (!prestadorExistente) {
    const prestador = await prisma.prestador.create({
      data: {
        id: randomUUID(),
        cnpj: '05065736000161',
        razaoSocial: 'PACBEL - PROGRAMAS PERSONALIZADOS LTDA',
        nomeFantasia: 'SISTEMA VIRTUAL',
        inscricaoMunicipal: '01733890014',
        email: 'financeiro@pacbel.com.br',
        telefone: '3196800154',
        endereco: 'RUA SOLANGE BERNARDES DECLIE',
        numero: '150',
        complemento: 'CASA 2',
        bairro: 'Diamante',
        codigoMunicipio: '3106200',
        uf: 'MG',
        cep: '30627222',
        serie: '1',
        ambiente: 2,
        optanteSimplesNacional: false,
        incentivadorCultural: false,
        exibirConstrucaoCivil: true,
        // Novos padrões municipais migrados de serviço
        codigoTributacao: '10300188',
        itemListaServico: '1.03',
        aliquota: 0.025,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    prestadorId = prestador.id;
    console.log('Prestador cadastrado com sucesso!');
  } else {
    prestadorId = prestadorExistente.id;
    console.log('Prestador já existe no banco de dados.');
  }

  // ===== NATUREZAS =====
  try {
    const naturezas = [
      { descricao: 'Venda', ativo: true },
      { descricao: 'Remessa', ativo: true },
      { descricao: 'Devolução', ativo: true },
      { descricao: 'Transferência', ativo: true },
    ];
    for (const n of naturezas) {
      const existente = await prisma.natureza.findFirst({ where: { descricao: n.descricao } });
      if (!existente) {
        await prisma.natureza.create({ data: { id: randomUUID(), ...n, createdAt: new Date(), updatedAt: new Date() } });
      }
    }
    console.log('Naturezas seed aplicadas.');
  } catch (e) {
    console.warn('Aviso: falha ao semear naturezas (tabela inexistente?)', e?.code || e?.message);
  }

  // ===== TRANSPORTADORAS =====
  try {
    const transportadoras = [
      {
        codigo: '1',
        razaoSocial: 'AUTOLOG TRANSPORTES LOGISTICA E ARMAZEM LTDA',
        endereco: 'R AMERICO SANTIAGO PIACENZA 750',
        uf: 'MG',
        codigoMunicipio: '3118601',
        cpfCnpj: '0887563000783',
        inscricaoEstadual: '0010477840299',
        ufVeiculo: 'MG',
        placaVeiculo: 'ABC1D23',
        ativo: true,
      },
      {
        codigo: '2',
        razaoSocial: 'TRANSPORTES RÁPIDOS LTDA',
        endereco: 'AV BRASIL 1000',
        uf: 'SP',
        codigoMunicipio: '3550308',
        cpfCnpj: '12345678000199',
        inscricaoEstadual: '1122334455',
        ufVeiculo: 'SP',
        placaVeiculo: 'EFG2H34',
        ativo: true,
      },
    ];
    for (const t of transportadoras) {
      await prisma.transportadora.upsert({
        where: { codigo: t.codigo },
        update: t,
        create: { id: randomUUID(), ...t },
      });
    }
    console.log('Transportadoras seed aplicadas.');
  } catch (e) {
    console.warn('Aviso: falha ao semear transportadoras (tabela inexistente?)', e?.code || e?.message);
  }

  // ===== PRODUTOS =====
  try {
    const produtos = [
      { codigo: 'P001', descricao: 'Produto de Exemplo 1', ncm: '84715010', cfop: '5101', unComercial: 'UN', precoVenda: 100.0, ativo: true },
      { codigo: 'P002', descricao: 'Produto de Exemplo 2', ncm: '84715010', cfop: '5102', unComercial: 'UN', precoVenda: 250.5, ativo: true },
    ];
    for (const p of produtos) {
      await prisma.produto.upsert({
        where: { codigo: p.codigo },
        update: p,
        create: { id: randomUUID(), ...p },
      });
    }
    console.log('Produtos seed aplicadas.');
  } catch (e) {
    console.warn('Aviso: falha ao semear produtos (tabela inexistente?)', e?.code || e?.message);
  }

  // ===== OPERADORAS DE CARTÃO =====
  try {
    const operadoras = [
      { descricao: 'CIELO', ativo: true, codigo: '001', bandeiraCodigo: 'VISA', bandeiraDescricao: 'Visa', cnpj: '00000000000000' },
      { descricao: 'REDE',  ativo: true, codigo: '002', bandeiraCodigo: 'MAST', bandeiraDescricao: 'Mastercard', cnpj: '00000000000000' },
    ];
    for (const o of operadoras) {
      const existente = await prisma.operadoraCartao.findFirst({ where: { descricao: o.descricao } });
      if (!existente) {
        await prisma.operadoraCartao.create({ data: { id: randomUUID(), ...o, createdAt: new Date(), updatedAt: new Date() } });
      }
    }
    console.log('Operadoras de cartão seed aplicadas.');
  } catch (e) {
    console.warn('Aviso: falha ao semear operadoras (tabela inexistente?)', e?.code || e?.message);
  }

  // ===== NFe (opcional) =====
  try {
    // cria uma NFe mínima apenas para validar os novos campos quando a tabela existir
    const existeAlguma = await prisma.nfe.findFirst();
    if (!existeAlguma) {
      const nfeId = randomUUID();
      await prisma.nfe.create({
        data: {
          id: nfeId,
          numero: 1,
          serie: 1,
          cnpjCliente: '00000000000000',
          nomeCliente: 'CLIENTE TESTE',
          dataEmissao: new Date(),
          valorTotal: 0,
          status: '0',
          protocolo: null,
          chaveAcesso: null,
        },
      });
      console.log('NFe inicial criada.');
    }
  } catch (e) {
    console.warn('Aviso: NFe não semeada (tabela/colunas podem não existir ainda).', e?.code || e?.message);
  }

  // ===== USUÁRIOS =====
  // Verificar se já existe um usuário Master no sistema
  const usuarioMasterExistente = await prisma.usuario.findFirst({
    where: { 
      role: 'Master'
    }
  });

  if (!usuarioMasterExistente) {
    // Criar usuário Master
    const senhaMasterHash = await hash('master123', 10);
    await prisma.usuario.create({
      data: {
        id: randomUUID(),
        nome: 'Usuário Master',
        email: 'master@pacbel.com.br',
        username: 'master',
        password: senhaMasterHash,
        role: 'Master',
        ativo: true,
        prestadorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Usuário Master criado com sucesso!');
  } else {
    console.log('Usuário Master já existe no sistema.');
  }

  // Verificar se já existe um usuário admin para o prestador
  const usuarioAdminExistente = await prisma.usuario.findFirst({
    where: { 
      prestadorId,
      role: 'Administrador'
    }
  });

  if (!usuarioAdminExistente) {
    // Criar usuário padrão para o prestador
    const senhaHash = await hash('admin', 10);
    await prisma.usuario.create({
      data: {
        id: randomUUID(),
        nome: 'Administrador',
        email: 'admin@pacbel.com.br',
        username: 'admin',
        password: senhaHash,
        role: 'Administrador',
        ativo: true,
        prestadorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Usuário Administrador criado com sucesso para o prestador!');
  } else {
    console.log('Usuário Administrador já existe para o prestador.');
  }

  // Criar um usuário comum para o prestador
  const usuarioComumExistente = await prisma.usuario.findFirst({
    where: { 
      prestadorId,
      role: 'Usuário'
    }
  });

  if (!usuarioComumExistente) {
    // Criar usuário comum para o prestador
    const senhaHash = await hash('usuario', 10);
    await prisma.usuario.create({
      data: {
        id: randomUUID(),
        nome: 'Usuário Comum',
        email: 'usuario@pacbel.com.br',
        username: 'usuario',
        password: senhaHash,
        role: 'Usuário',
        ativo: true,
        prestadorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('Usuário comum criado com sucesso para o prestador!');
  } else {
    console.log('Usuário comum já existe para o prestador.');
  }

  // ===== TOMADORES =====
  // Array com os dados dos tomadores dos XMLs e outros tomadores
  const tomadores = [
    {
      cpfCnpj: '17585568000114',
      tipo: 'J',
      razaoSocial: 'ASSOCIACAO DO AMAPA GARDEN SHOPPING',
      inscricaoMunicipal: '',
      email: 'gustavo.christopher@grupotenco.com.br',
      telefone: '9699999999',
      endereco: 'Rodovia Juscelino Kubitschek',
      numero: '2151',
      complemento: '',
      bairro: 'Universidade',
      codigoMunicipio: '1600303',
      uf: 'AP',
      cep: '68903419',
    },
    {
      cpfCnpj: '20744630000188',
      tipo: 'J',
      razaoSocial: 'ASSOCIACAO DO RORAIMA GARDEN SHOPPING',
      inscricaoMunicipal: '',
      email: 'eduardo.rocha@grupotenco.com.br',
      telefone: '9599999999',
      endereco: 'Avenida Ville Roy',
      numero: '1544',
      complemento: '',
      bairro: 'Cacari',
      codigoMunicipio: '1400100',
      uf: 'RR',
      cep: '69307725',
    },
    {
      cpfCnpj: '11273147000171',
      tipo: 'J',
      razaoSocial: 'ESCRITORIO CONTABIL CSC-SP LTDA',
      inscricaoMunicipal: '',
      email: 'vanessa@captacao.net',
      telefone: '1199999999',
      endereco: 'Praca Dom Jose Gaspar',
      numero: '134',
      complemento: '',
      bairro: 'Republica',
      codigoMunicipio: '3550308',
      uf: 'SP',
      cep: '01047010',
    },
  ];

  // Cadastrar cada tomador se não existir
  const tomadorIds = [];
  for (const tomador of tomadores) {
    const tomadorExistente = await prisma.tomador.findFirst({
      where: { cpfCnpj: tomador.cpfCnpj }
    });

    if (!tomadorExistente) {
      const novoTomador = await prisma.tomador.create({
        data: {
          id: randomUUID(),
          ...tomador,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      tomadorIds.push(novoTomador.id);
      console.log(`Tomador ${tomador.razaoSocial} cadastrado com sucesso!`);
    } else {
      tomadorIds.push(tomadorExistente.id);
      console.log(`Tomador ${tomador.razaoSocial} já existe no banco de dados.`);
    }
  }

  // ===== SERVIÇOS =====
  // Array com os serviços a serem cadastrados
  const servicos = [
    {
      descricao: 'CESSÃO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR',
      valorUnitario: 260.00,
      issRetido: false,
      outrasRetencoes: 0,
      descontoCondicionado: 0,
      descontoIncondicionado: 0,
    },
    {
      descricao: 'LICENCIAMENTO OU CESSÃO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR',
      valorUnitario: 2800.80,
      issRetido: false,
      outrasRetencoes: 0,
      descontoCondicionado: 0,
      descontoIncondicionado: 0,
    }
  ];
  
  // Cadastrar cada serviço se não existir
  const servicoIds = [];
  for (const servico of servicos) {
    const servicoExistente = await prisma.servico.findFirst({
      where: {
        descricao: servico.descricao,
        valorUnitario: servico.valorUnitario
      }
    });

    if (!servicoExistente) {
      const novoServico = await prisma.servico.create({
        data: {
          id: randomUUID(),
          ...servico,
          createdAt: new Date(),
          updatedAt: new Date()
        },
      });
      servicoIds.push(novoServico.id);
      console.log(`Serviço com valor unitário de R$ ${servico.valorUnitario.toFixed(2)} cadastrado com sucesso!`);
    } else {
      servicoIds.push(servicoExistente.id);
      console.log(`Serviço com valor unitário de R$ ${servico.valorUnitario.toFixed(2)} já existe no banco de dados.`);
    }
  }

  // ===== NOTAS FISCAIS =====
  // Verificar se já existem notas fiscais
  const notasFiscaisExistentes = await prisma.notafiscal.count();
  
  if (notasFiscaisExistentes < 6) {
    console.log('Criando 6 notas fiscais...');
    
    // Criar 6 notas fiscais com diferentes status
    const statusOptions = ['0', '1', '2','3','4','5']; // 0: Não Transmitida, 1: Autorizada, 2:Cancelada, 3: Em Espera, 4: Rejeitada, 5: Processando
    
    for (let i = 1; i <= 6; i++) {
      const dataEmissao = new Date();
      dataEmissao.setDate(dataEmissao.getDate() - i); // Cada nota com uma data diferente
      
      const status = statusOptions[i % 3]; // Alterna entre os status
      const tomadorId = tomadorIds[i % tomadorIds.length];
      const servicoId = servicoIds[i % servicoIds.length];
      
      // Valores para a nota fiscal
      const valorUnitario = i * 100;
      const quantidade = 1;
      const valorTotal = valorUnitario * quantidade;
      
      // Criar a nota fiscal
      const notaFiscalId = randomUUID();
      await prisma.notafiscal.create({
        data: {
          id: notaFiscalId,
          numero: `${1000 + i}`,
          serie: '1',
          tipo: '1',
          status,
          ambiente: 2,
          naturezaOperacao: 1,
          optanteSimplesNacional: false,
          incentivadorCultural: false,
          dataEmissao,
          competencia: dataEmissao,
          prestadorId,
          tomadorId,
          valorServicos: valorTotal,
          valorLiquidoNfse: valorTotal,
          discriminacao: `Serviço de software - Nota ${1000 + i}`,
          protocolo: status !== '0' ? `PROT${100000 + i}` : null,
          // Campos adicionados recentemente ao modelo
          // numeroLote e dataRecebimento serão adicionados após a geração do cliente Prisma
          xmlRPS: status !== '0' ? `<rps><numero>${1000 + i}</numero><serie>1</serie></rps>` : null,
          xmlRetorno: status !== '0' ? `<nfse><numero>${1000 + i}</numero><codigo>XYZ${i}</codigo></nfse>` : null,
          createdAt: new Date(dataEmissao.getTime() - 1000 * 60 * 60), // 1 hora antes da emissão
          updatedAt: new Date(),
          // Criar item da nota fiscal
          itemnotafiscal: {
            create: {
              id: randomUUID(),
              servicoId,
              quantidade,
              valorUnitario,
              valorTotal,
              desconto: 0,
              tributavel: true,
              discriminacao: `Item de serviço - Nota ${1000 + i}`,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
      });
      
      console.log(`Nota fiscal ${1000 + i} criada com sucesso! Status: ${status}`);
    }
  } else {
    console.log(`Já existem ${notasFiscaisExistentes} notas fiscais no banco de dados.`);
  }

  // ===== CONFIGURAÇÃO =====
  const configExistente = await prisma.configuracao.findFirst({
    where: { chave: 'ambiente_nfse' }
  });

  if (!configExistente) {
    await prisma.configuracao.create({
      data: {
        id: randomUUID(),
        chave: 'ambiente_nfse',
        valor: '2',
        descricao: 'Ambiente de homologação',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Configuração cadastrada com sucesso!');
  } else {
    console.log('Configuração já existe no banco de dados.');
  }

  // ===== ERROS =====
  const { erros } = require('./erros-seed');
  for (const erro of erros) {
    const erroExistente = await prisma.erros.findFirst({
      where: { codigo: erro.codigo }
    });
    if (!erroExistente) {
      await prisma.erros.create({
        data: {
          id: randomUUID(),
          codigo: erro.codigo,
          mensagem: erro.mensagem,
          motivo: erro.motivo,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`Erro ${erro.codigo} inserido com sucesso!`);
    } else {
      console.log(`Erro ${erro.codigo} já existe.`);
    }
  }

  console.log('Seed unificado concluído com sucesso!');
  console.log('==== FIM DO SEED ====' );
}



main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
