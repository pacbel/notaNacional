/*
  Warnings:

  - The primary key for the `ConfiguracaoDps` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[prestadorId]` on the table `ConfiguracaoDps` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `prestadorId` to the `ConfiguracaoDps` table without a default value. This is not possible if the table is not empty.

*/
-- Deletar configuração existente (será recriada por prestador)
DELETE FROM `ConfiguracaoDps`;

-- AlterTable
ALTER TABLE `ConfiguracaoDps` DROP PRIMARY KEY,
    ADD COLUMN `prestadorId` CHAR(36) NOT NULL,
    MODIFY `id` CHAR(36) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `ConfiguracaoDps_prestadorId_key` ON `ConfiguracaoDps`(`prestadorId`);

-- CreateIndex
CREATE INDEX `ConfiguracaoDps_prestadorId_idx` ON `ConfiguracaoDps`(`prestadorId`);

-- AddForeignKey
ALTER TABLE `ConfiguracaoDps` ADD CONSTRAINT `ConfiguracaoDps_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
