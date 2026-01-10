/*
  Warnings:

  - You are about to drop the column `certificadoArquivoNome` on the `Prestador` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoArquivoPath` on the `Prestador` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoIdApi` on the `Prestador` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoSenha` on the `Prestador` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoValidade` on the `Prestador` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Prestador` DROP COLUMN `certificadoArquivoNome`,
    DROP COLUMN `certificadoArquivoPath`,
    DROP COLUMN `certificadoIdApi`,
    DROP COLUMN `certificadoSenha`,
    DROP COLUMN `certificadoValidade`;

-- AlterTable
ALTER TABLE `TokenIntegracao` MODIFY `token` TEXT NOT NULL;
