-- AddPrestadorIdToTables
-- Adicionar prestadorId nas tabelas Tomador e Servico para isolamento de dados por prestador

-- Adicionar coluna prestadorId em Tomador
ALTER TABLE `Tomador` ADD COLUMN `prestadorId` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Adicionar coluna prestadorId em Servico
ALTER TABLE `Servico` ADD COLUMN `prestadorId` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Atualizar Tomador com prestadorId do primeiro prestador ativo (migração de dados existentes)
UPDATE `Tomador` t
SET t.`prestadorId` = (SELECT p.`id` FROM `Prestador` p WHERE p.`ativo` = 1 LIMIT 1)
WHERE t.`prestadorId` = '00000000-0000-0000-0000-000000000000';

-- Atualizar Servico com prestadorId do primeiro prestador ativo (migração de dados existentes)
UPDATE `Servico` s
SET s.`prestadorId` = (SELECT p.`id` FROM `Prestador` p WHERE p.`ativo` = 1 LIMIT 1)
WHERE s.`prestadorId` = '00000000-0000-0000-0000-000000000000';

-- Remover constraint unique de documento em Tomador
ALTER TABLE `Tomador` DROP INDEX `Tomador_documento_key`;

-- Adicionar foreign keys
ALTER TABLE `Tomador` ADD CONSTRAINT `Tomador_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Servico` ADD CONSTRAINT `Servico_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Criar índices
CREATE INDEX `Tomador_prestadorId_idx` ON `Tomador`(`prestadorId`);
CREATE INDEX `Servico_prestadorId_idx` ON `Servico`(`prestadorId`);

-- Criar constraint unique composta para Tomador (prestadorId + documento)
CREATE UNIQUE INDEX `Tomador_prestadorId_documento_key` ON `Tomador`(`prestadorId`, `documento`);
