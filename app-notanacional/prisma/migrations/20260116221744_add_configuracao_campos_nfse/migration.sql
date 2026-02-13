/*
  Warnings:

  - You are about to drop the column `certificadoId` on the `Dps` table. All the data in the column will be lost.
  - You are about to drop the column `certificateId` on the `NotaFiscal` table. All the data in the column will be lost.
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
ALTER TABLE `ConfiguracaoDps` ADD COLUMN `opSimpNac` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `regEspTrib` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `tpAmb` INTEGER NOT NULL DEFAULT 2,
    MODIFY `tpImunidade` INTEGER NOT NULL DEFAULT 0,
    MODIFY `tribISSQN` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
-- ALTER TABLE `Dps` DROP COLUMN `certificadoId`;

-- AlterTable
-- ALTER TABLE `NotaFiscal` DROP COLUMN `certificateId`;

-- AlterTable
-- ALTER TABLE `Servico` ALTER COLUMN `prestadorId` DROP DEFAULT;

-- AlterTable
-- ALTER TABLE `Tomador` ALTER COLUMN `prestadorId` DROP DEFAULT;

-- DropTable
-- DROP TABLE `Certificado`;

-- DropTable
-- DROP TABLE `Prestador`;
