ALTER TABLE `Dps`
  ADD COLUMN `cancelamentoInfPedRegId` VARCHAR(64) NULL,
  ADD COLUMN `cancelamentoResponseContentType` VARCHAR(120) NULL,
  ADD COLUMN `cancelamentoResponseContent` LONGTEXT NULL;
