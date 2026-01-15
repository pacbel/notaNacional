import { PrismaClient, UsuarioRole, Ambiente, TipoDocumento, Prisma } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senhaPadrao = process.env.SEED_SENHA_PADRAO ?? "Camgfv!@#2025";
  const senhaHash = await hash(senhaPadrao, 10);

  const usuario = await prisma.usuario.upsert({
    where: { email: "carlos.pacheco@pacbel.com.br" },
    update: {},
    create: {
      nome: "Carlos Pacheco",
      email: "carlos.pacheco@pacbel.com.br",
      senhaHash,
      role: UsuarioRole.ADMIN,
    },
  });

  const configuracaoUpdateData = {
    nomeSistema: "NotaClient",
    versaoAplicacao: "1.0.0",
    verAplic: "EmissorPontoBR1.0",
    ambientePadrao: Ambiente.HOMOLOGACAO,
    seriePadrao: 1,
    numeroInicialDps: 1,
    robotClientId: process.env.ROBOT_CLIENT_ID ?? null,
    robotClientSecret: process.env.ROBOT_CLIENT_SECRET ?? null,
    xLocEmi: "Belo Horizonte",
    xLocPrestacao: "Belo Horizonte",
    nNFSe: "40",
    xTribNac: "Medicina.",
    xNBS: "Serviços de clínica médica",
    ambGer: 2,
    tpEmis: 1,
    procEmi: 1,
    cStat: 100,
    dhProc: new Date("2025-12-30T20:54:34-03:00"),
    nDFSe: "778552",
    tribISSQN: 2,
    tpImunidade: 3,
    tpRetISSQN: 1,
    pTotTribFed: new Prisma.Decimal(0),
    pTotTribEst: new Prisma.Decimal(0),
    pTotTribMun: new Prisma.Decimal(0),
  } as Prisma.ConfiguracaoDpsUpdateInput;

  const configuracaoCreateData = {
    nomeSistema: "NotaClient",
    versaoAplicacao: "1.0.0",
    verAplic: "EmissorPontoBR1.0",
    ambientePadrao: Ambiente.HOMOLOGACAO,
    seriePadrao: 1,
    numeroInicialDps: 1,
    robotClientId: process.env.ROBOT_CLIENT_ID ?? null,
    robotClientSecret: process.env.ROBOT_CLIENT_SECRET ?? null,
    xLocEmi: "Belo Horizonte",
    xLocPrestacao: "Belo Horizonte",
    nNFSe: "40",
    xTribNac: "Medicina.",
    xNBS: "Serviços de clínica médica",
    ambGer: 2,
    tpEmis: 1,
    procEmi: 1,
    cStat: 100,
    dhProc: new Date("2025-12-30T20:54:34-03:00"),
    nDFSe: "778552",
    tribISSQN: 2,
    tpImunidade: 3,
    tpRetISSQN: 1,
    pTotTribFed: new Prisma.Decimal(0),
    pTotTribEst: new Prisma.Decimal(0),
    pTotTribMun: new Prisma.Decimal(0),
  } as Prisma.ConfiguracaoDpsCreateInput;

  const config = await prisma.configuracaoDps.upsert({
    where: { id: 1 },
    update: configuracaoUpdateData,
    create: configuracaoCreateData,
  });

  const prestador = await prisma.prestador.upsert({
    where: { cnpj: "05065736000161" },
    update: {
      nomeFantasia: "PACBEL PROGRAMAS LTDA",
      razaoSocial: "PACBEL PROGRAMAS LTDA",
      email: "carlos.pacheco@pacbel.com.br",
    },
    create: {
      nomeFantasia: "PACBEL PROGRAMAS LTDA",
      razaoSocial: "PACBEL PROGRAMAS LTDA",
      cnpj: "05065736000161",
      inscricaoMunicipal: "123456",
      email: "carlos.pacheco@pacbel.com.br",
      telefone: "31996800154",
      codigoMunicipio: "3106200",
      cidade: "Belo Horizonte",
      estado: "MG",
      cep: "30627222",
      logradouro: "Rua Solange Bernardes Declie",
      numero: "150",
      complemento: "Sala 101",
      bairro: "Diamante (Barreiro)",
    },
  });

  const tomador = await prisma.tomador.upsert({
    where: { documento: "76798259634" },
    update: {
      nomeRazaoSocial: "CARLOS ROBERTO PACHECO LIMA",
      email: "carlos.pacheco@pacbel.com.br",
    },
    create: {
      tipoDocumento: TipoDocumento.CPF,
      documento: "76798259634",
      nomeRazaoSocial: "CARLOS ROBERTO PACHECO LIMA",
      email: "carlos.pacheco@pacbel.com.br",
      telefone: "31996800154",
      codigoMunicipio: "3106200",
      cidade: "Belo Horizonte",
      estado: "MG",
      cep: "30627222",
      logradouro: "Rua Solange Bernardes Declie",
      numero: "150",
      complemento: "101",
      bairro: "Diamante (Barreiro)",
    },
  });

  const servicoId = "6f5c0eac-5a44-4aa4-bc71-2df42d4a9f8a";

  const servico = await prisma.servico.upsert({
    where: { id: servicoId },
    update: {
      descricao: "Serviço de tecnologia",
      valorUnitario: 152.3,
    },
    create: {
      id: servicoId,
      descricao: "Serviço de tecnologia",
      codigoTributacaoMunicipal: "001",
      codigoTributacaoNacional: "040101",
      codigoNbs: "123012100",
      codigoMunicipioPrestacao: "3106200",
      municipioPrestacao: "Belo Horizonte",
      informacoesComplementares: "Nota Avulsa AVU-20251230235416",
      valorUnitario: 152.3,
    },
  });

  console.log({ usuario, config, prestador, tomador, servico });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
