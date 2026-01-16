-- RemoveUsuarioTables
-- Remover controle de usuários local e migrar para API externa

-- Remover foreign key de LogSistema
ALTER TABLE `LogSistema` DROP FOREIGN KEY `LogSistema_usuarioId_fkey`;

-- Remover tabelas relacionadas a usuários
DROP TABLE IF EXISTS `MfaChallenge`;
DROP TABLE IF EXISTS `Sessao`;
DROP TABLE IF EXISTS `Usuario`;
