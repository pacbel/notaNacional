-- Adiciona colunas faltantes no banco sem resetar dados
-- Banco: MySQL

ALTER TABLE `prestador`
  ADD COLUMN IF NOT EXISTS `tpRetIssqn` INT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `opSimpNac` INT NULL DEFAULT 1;
