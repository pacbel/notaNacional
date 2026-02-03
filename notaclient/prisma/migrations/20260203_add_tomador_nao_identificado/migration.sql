-- AlterTable
ALTER TABLE `Dps`
    MODIFY `tomadorId` CHAR(36) NULL,
    ADD COLUMN `tomadorNaoIdentificado` BOOLEAN NOT NULL DEFAULT false AFTER `observacoes`;
