-- AlterTable
ALTER TABLE `NotaFiscal` DROP FOREIGN KEY `NotaFiscal_tomadorId_fkey`;
ALTER TABLE `NotaFiscal` MODIFY `tomadorId` CHAR(36) NULL;
ALTER TABLE `NotaFiscal` ADD CONSTRAINT `NotaFiscal_tomadorId_fkey` FOREIGN KEY (`tomadorId`) REFERENCES `Tomador`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
