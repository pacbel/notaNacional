import { PrismaClient, Ambiente, TipoDocumento, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Usuários, Prestadores, Tomadores e Serviços agora são gerenciados pela API externa
  console.log("Iniciando seed do banco de dados...");
  console.log("Apenas configurando dados do sistema...");

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

  console.log("Seed concluído com sucesso!");
  console.log("Configuração do sistema criada/atualizada.");
  console.log({ config });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
