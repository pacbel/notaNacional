-- AlterTable
ALTER TABLE `ConfiguracaoDps` ADD COLUMN `numeroInicialDps` INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX `Dps_prestadorId_numero_serie_key` ON `Dps`(`prestadorId`, `numero`, `serie`);
