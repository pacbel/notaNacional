/*
  Warnings:

  - You are about to drop the column `nDFSe` on the `ConfiguracaoDps` table. All the data in the column will be lost.
  - You are about to drop the column `nNFSe` on the `ConfiguracaoDps` table. All the data in the column will be lost.
  - You are about to drop the column `verAplic` on the `ConfiguracaoDps` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoId` on the `Dps` table. All the data in the column will be lost.
  - You are about to drop the column `certificateId` on the `NotaFiscal` table. All the data in the column will be lost.
  - You are about to drop the column `codigoMunicipioPrestacao` on the `Servico` table. All the data in the column will be lost.
  - You are about to drop the column `informacoesComplementares` on the `Servico` table. All the data in the column will be lost.
  - You are about to drop the column `municipioPrestacao` on the `Servico` table. All the data in the column will be lost.
  - You are about to drop the `Certificado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Prestador` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
-- ALTER TABLE `Dps` DROP FOREIGN KEY `Dps_certificadoId_fkey`;

-- DropForeignKey
-- ALTER TABLE `Dps` DROP FOREIGN KEY `Dps_prestadorId_fkey`;

-- DropForeignKey
-- ALTER TABLE `NotaFiscal` DROP FOREIGN KEY `NotaFiscal_certificateId_fkey`;

-- DropForeignKey
-- ALTER TABLE `NotaFiscal` DROP FOREIGN KEY `NotaFiscal_prestadorId_fkey`;

-- DropForeignKey
-- ALTER TABLE `Prestador` DROP FOREIGN KEY `Prestador_certificadoPadraoId_fkey`;

-- DropForeignKey
-- ALTER TABLE `Servico` DROP FOREIGN KEY `Servico_prestadorId_fkey`;

-- DropForeignKey
-- ALTER TABLE `Tomador` DROP FOREIGN KEY `Tomador_prestadorId_fkey`;

-- DropIndex
-- DROP INDEX `LogSistema_usuarioId_fkey` ON `LogSistema`;

-- AlterTable
-- ALTER TABLE `ConfiguracaoDps`
--     ADD COLUMN `aliquotaIss` DECIMAL(5, 2) NULL,
--     ADD COLUMN `issRetido` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
-- ALTER TABLE `Dps` DROP COLUMN `certificadoId`;

-- AlterTable
-- ALTER TABLE `NotaFiscal` DROP COLUMN `certificateId`;

-- AlterTable
-- ALTER TABLE `Servico` DROP COLUMN `codigoMunicipioPrestacao`,
--     DROP COLUMN `informacoesComplementares`,
--     DROP COLUMN `municipioPrestacao`,
--     MODIFY `descricao` VARCHAR(1000) NOT NULL,
--     ALTER COLUMN `prestadorId` DROP DEFAULT;

-- AlterTable
-- ALTER TABLE `Tomador` ADD COLUMN `cidadeExterior` VARCHAR(60) NULL,
--     ADD COLUMN `codigoPais` VARCHAR(3) NULL,
--     ADD COLUMN `codigoPostalExterior` VARCHAR(20) NULL,
--     ADD COLUMN `estadoExterior` VARCHAR(60) NULL,
--     ADD COLUMN `tipoTomador` ENUM('NACIONAL', 'ESTRANGEIRO', 'ANONIMO') NOT NULL DEFAULT 'NACIONAL',
--     MODIFY `tipoDocumento` ENUM('CPF', 'CNPJ') NULL,
--     MODIFY `documento` VARCHAR(40) NULL,
--     MODIFY `codigoMunicipio` VARCHAR(7) NULL,
--     MODIFY `cidade` VARCHAR(191) NULL,
--     MODIFY `estado` VARCHAR(2) NULL,
--     MODIFY `cep` VARCHAR(8) NULL,
--     MODIFY `logradouro` VARCHAR(191) NULL,
--     MODIFY `numero` VARCHAR(191) NULL,
--     MODIFY `bairro` VARCHAR(120) NULL,
--     ALTER COLUMN `prestadorId` DROP DEFAULT;

-- DropTable
-- DROP TABLE `Certificado`;

-- DropTable
-- DROP TABLE `Prestador`;
