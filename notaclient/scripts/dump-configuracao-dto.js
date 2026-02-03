/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function mapConfiguracaoToDto(configuracao) {
  const numeroInicialDps = configuracao.numeroInicialDps ?? 1;

  return {
    nomeSistema: configuracao.nomeSistema,
    versaoAplicacao: configuracao.versaoAplicacao,
    ambientePadrao: configuracao.ambientePadrao,
    seriePadrao: configuracao.seriePadrao,
    numeroInicialDps,
    emailRemetente: configuracao.emailRemetente,
    robotClientId: configuracao.robotClientId,
    robotClientSecret: configuracao.robotClientSecret,
    robotTokenCacheMinutos: configuracao.robotTokenCacheMinutos,
    ftpHost: configuracao.ftpHost ?? null,
    ftpUsuario: configuracao.ftpUsuario ?? null,
    ftpSenha: configuracao.ftpSenha ?? null,
    mfaCodigoExpiracaoMinutos: configuracao.mfaCodigoExpiracaoMinutos,
    enviarNotificacaoEmailPrestador: configuracao.enviarNotificacaoEmailPrestador,
    ativo: configuracao.ativo,
    xLocEmi: configuracao.xLocEmi,
    xLocPrestacao: configuracao.xLocPrestacao,
    tpAmb: configuracao.tpAmb,
    opSimpNac: configuracao.opSimpNac,
    regEspTrib: configuracao.regEspTrib,
    ambGer: configuracao.ambGer,
    tpEmis: configuracao.tpEmis,
    procEmi: configuracao.procEmi,
    cStat: configuracao.cStat,
    dhProc: configuracao.dhProc ? configuracao.dhProc.toISOString() : null,
    tribMun: {
      tribISSQN: configuracao.tribISSQN,
      tpImunidade: configuracao.tpImunidade,
      tpRetISSQN: configuracao.tpRetISSQN,
    },
    pTotTribFed: Number(configuracao.pTotTribFed),
    pTotTribEst: Number(configuracao.pTotTribEst),
    pTotTribMun: Number(configuracao.pTotTribMun),
  };
}

async function main() {
  const prestadorId = process.argv[2];
  if (!prestadorId) {
    throw new Error("Informe o prestadorId (uuid)");
  }

  const configuracao = await prisma.configuracaoDps.findUnique({
    where: { prestadorId },
  });

  if (!configuracao) {
    console.log("Nenhuma configuração encontrada");
    return;
  }

  console.log(JSON.stringify(mapConfiguracaoToDto(configuracao), null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
