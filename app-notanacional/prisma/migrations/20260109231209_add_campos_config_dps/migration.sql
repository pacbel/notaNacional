/*
  Warnings:

  - A unique constraint covering the columns `[prestadorId,identificador]` on the table `Dps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nNFSe` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xLocEmi` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xLocPrestacao` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xNBS` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `xTribNac` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codigoLocalEmissao` to the `Dps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identificador` to the `Dps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoEmissao` to the `Dps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versao` to the `Dps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versaoAplicacao` to the `Dps` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ConfiguracaoDps` ADD COLUMN `ambGer` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `cStat` INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN `dhProc` DATETIME(3) NULL,
    ADD COLUMN `nDFSe` VARCHAR(30) NULL,
    ADD COLUMN `nNFSe` VARCHAR(30) NOT NULL,
    ADD COLUMN `pTotTribEst` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `pTotTribFed` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `pTotTribMun` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `procEmi` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `tpEmis` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `tpImunidade` INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN `tpRetISSQN` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `tribISSQN` INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN `xLocEmi` VARCHAR(191) NOT NULL,
    ADD COLUMN `xLocPrestacao` VARCHAR(191) NOT NULL,
    ADD COLUMN `xNBS` VARCHAR(191) NOT NULL,
    ADD COLUMN `xTribNac` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Dps` ADD COLUMN `codigoLocalEmissao` VARCHAR(7) NOT NULL,
    ADD COLUMN `dataEnvio` DATETIME(3) NULL,
    ADD COLUMN `dataRetorno` DATETIME(3) NULL,
    ADD COLUMN `digestValue` VARCHAR(255) NULL,
    ADD COLUMN `identificador` VARCHAR(60) NOT NULL,
    ADD COLUMN `jsonEntrada` LONGTEXT NULL,
    ADD COLUMN `mensagemErro` LONGTEXT NULL,
    ADD COLUMN `protocolo` VARCHAR(120) NULL,
    ADD COLUMN `tipoEmissao` INTEGER NOT NULL,
    ADD COLUMN `versao` VARCHAR(10) NOT NULL,
    ADD COLUMN `versaoAplicacao` VARCHAR(60) NOT NULL,
    ADD COLUMN `xmlAssinado` LONGTEXT NULL;

-- AlterTable
ALTER TABLE `NotaFiscal` MODIFY `certificateId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Prestador` ADD COLUMN `certificadoPadraoId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Certificado` (
    `id` VARCHAR(191) NOT NULL,
    `apelido` VARCHAR(191) NULL,
    `cnpj` VARCHAR(14) NULL,
    `numeroSerie` VARCHAR(191) NULL,
    `emissor` VARCHAR(191) NULL,
    `validadeInicio` DATETIME(3) NULL,
    `validadeFim` DATETIME(3) NULL,
    `tipo` VARCHAR(60) NULL,
    `arquivoPath` VARCHAR(255) NULL,
    `senha` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Certificado_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Dps_prestadorId_identificador_key` ON `Dps`(`prestadorId`, `identificador`);

-- AddForeignKey
ALTER TABLE `Prestador` ADD CONSTRAINT `Prestador_certificadoPadraoId_fkey` FOREIGN KEY (`certificadoPadraoId`) REFERENCES `Certificado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dps` ADD CONSTRAINT `Dps_certificadoId_fkey` FOREIGN KEY (`certificadoId`) REFERENCES `Certificado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotaFiscal` ADD CONSTRAINT `NotaFiscal_certificateId_fkey` FOREIGN KEY (`certificateId`) REFERENCES `Certificado`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
