-- DropIndex
DROP INDEX `LogSistema_usuarioId_fkey` ON `LogSistema`;

-- AlterTable
ALTER TABLE `Servico` ALTER COLUMN `prestadorId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Tomador` ALTER COLUMN `prestadorId` DROP DEFAULT;
