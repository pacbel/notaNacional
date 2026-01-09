CREATE TABLE `Usuario` (
    `id` CHAR(36) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'OPERADOR') NOT NULL DEFAULT 'ADMIN',
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Sessao` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `userAgent` VARCHAR(255) NULL,
    `ip` VARCHAR(45) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sessao_usuarioId_ativo_idx`(`usuarioId`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MfaChallenge` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(255) NOT NULL,
    `motivo` ENUM('LOGIN', 'RECUPERACAO_SENHA') NOT NULL DEFAULT 'LOGIN',
    `expiresAt` DATETIME(3) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MfaChallenge_token_key`(`token`),
    INDEX `MfaChallenge_usuarioId_idx`(`usuarioId`),
    INDEX `MfaChallenge_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ConfiguracaoDps` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `nomeSistema` VARCHAR(191) NOT NULL,
    `versaoAplicacao` VARCHAR(50) NOT NULL,
    `ambientePadrao` ENUM('PRODUCAO', 'HOMOLOGACAO') NOT NULL DEFAULT 'HOMOLOGACAO',
    `seriePadrao` INTEGER NOT NULL DEFAULT 1,
    `verAplic` VARCHAR(60) NOT NULL,
    `emailRemetente` VARCHAR(191) NULL,
    `robotClientId` VARCHAR(191) NULL,
    `robotClientSecret` VARCHAR(191) NULL,
    `robotTokenCacheMinutos` INTEGER NOT NULL DEFAULT 50,
    `mfaCodigoExpiracaoMinutos` INTEGER NOT NULL DEFAULT 10,
    `enviarNotificacaoEmailPrestador` BOOLEAN NOT NULL DEFAULT true,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Prestador` (
    `id` CHAR(36) NOT NULL,
    `nomeFantasia` VARCHAR(191) NOT NULL,
    `razaoSocial` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(14) NOT NULL,
    `inscricaoMunicipal` VARCHAR(30) NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `codigoMunicipio` VARCHAR(7) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(2) NOT NULL,
    `cep` VARCHAR(8) NOT NULL,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `complemento` VARCHAR(60) NULL,
    `bairro` VARCHAR(120) NOT NULL,
    `certificadoArquivoNome` VARCHAR(191) NULL,
    `certificadoArquivoPath` VARCHAR(255) NULL,
    `certificadoSenha` VARCHAR(191) NULL,
    `certificadoIdApi` VARCHAR(191) NULL,
    `certificadoValidade` DATETIME(3) NULL,
    `observacoes` LONGTEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Prestador_cnpj_key`(`cnpj`),
    INDEX `Prestador_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Tomador` (
    `id` CHAR(36) NOT NULL,
    `tipoDocumento` ENUM('CPF', 'CNPJ') NOT NULL,
    `documento` VARCHAR(14) NOT NULL,
    `nomeRazaoSocial` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(20) NULL,
    `inscricaoMunicipal` VARCHAR(30) NULL,
    `codigoMunicipio` VARCHAR(7) NOT NULL,
    `cidade` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(2) NOT NULL,
    `cep` VARCHAR(8) NOT NULL,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(20) NOT NULL,
    `complemento` VARCHAR(60) NULL,
    `bairro` VARCHAR(120) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Tomador_documento_idx`(`documento`),
    INDEX `Tomador_ativo_idx`(`ativo`),
    UNIQUE INDEX `Tomador_documento_key`(`documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Servico` (
    `id` CHAR(36) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `codigoTributacaoMunicipal` VARCHAR(20) NOT NULL,
    `codigoTributacaoNacional` VARCHAR(20) NOT NULL,
    `codigoNbs` VARCHAR(20) NULL,
    `codigoMunicipioPrestacao` VARCHAR(7) NOT NULL,
    `municipioPrestacao` VARCHAR(191) NOT NULL,
    `informacoesComplementares` LONGTEXT NULL,
    `valorUnitario` DECIMAL(12, 2) NOT NULL,
    `aliquotaIss` DECIMAL(5, 2) NULL,
    `issRetido` BOOLEAN NOT NULL DEFAULT false,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Servico_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Dps` (
    `id` CHAR(36) NOT NULL,
    `numero` INTEGER NOT NULL,
    `serie` INTEGER NOT NULL,
    `competencia` DATETIME(3) NOT NULL,
    `dataEmissao` DATETIME(3) NOT NULL,
    `ambiente` ENUM('PRODUCAO', 'HOMOLOGACAO') NOT NULL DEFAULT 'HOMOLOGACAO',
    `status` ENUM('RASCUNHO', 'ASSINADO', 'ENVIADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
    `prestadorId` CHAR(36) NOT NULL,
    `tomadorId` CHAR(36) NOT NULL,
    `servicoId` CHAR(36) NOT NULL,
    `xmlGerado` LONGTEXT NULL,
    `observacoes` LONGTEXT NULL,
    `certificadoId` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Dps_numero_serie_idx`(`numero`, `serie`),
    INDEX `Dps_prestadorId_idx`(`prestadorId`),
    INDEX `Dps_tomadorId_idx`(`tomadorId`),
    INDEX `Dps_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotaFiscal` (
    `id` CHAR(36) NOT NULL,
    `dpsId` CHAR(36) NOT NULL,
    `prestadorId` CHAR(36) NOT NULL,
    `tomadorId` CHAR(36) NOT NULL,
    `ambiente` ENUM('PRODUCAO', 'HOMOLOGACAO') NOT NULL DEFAULT 'HOMOLOGACAO',
    `certificateId` VARCHAR(191) NOT NULL,
    `chaveAcesso` VARCHAR(60) NOT NULL,
    `numero` VARCHAR(30) NOT NULL,
    `codigoVerificacao` VARCHAR(60) NULL,
    `urlNfse` VARCHAR(255) NULL,
    `statusCode` INTEGER NULL,
    `rawResponseContentType` VARCHAR(120) NULL,
    `rawResponseContent` LONGTEXT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `NotaFiscal_dpsId_key`(`dpsId`),
    INDEX `NotaFiscal_chaveAcesso_idx`(`chaveAcesso`),
    INDEX `NotaFiscal_ambiente_idx`(`ambiente`),
    INDEX `NotaFiscal_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NotaDocumento` (
    `id` CHAR(36) NOT NULL,
    `notaFiscalId` CHAR(36) NOT NULL,
    `tipo` ENUM('XML_ASSINADO', 'XML_NFSE', 'NFSE_GZIP', 'DANFSE_PDF', 'OUTRO') NOT NULL,
    `conteudo` LONGTEXT NOT NULL,
    `contentType` VARCHAR(120) NULL,
    `nomeArquivo` VARCHAR(191) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NotaDocumento_notaFiscalId_idx`(`notaFiscalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TokenIntegracao` (
    `id` CHAR(36) NOT NULL,
    `tipo` ENUM('ROBOT') NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TokenIntegracao_tipo_idx`(`tipo`),
    INDEX `TokenIntegracao_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LogSistema` (
    `id` CHAR(36) NOT NULL,
    `usuarioId` CHAR(36) NULL,
    `nivel` ENUM('INFO', 'AVISO', 'ERRO') NOT NULL DEFAULT 'INFO',
    `origem` VARCHAR(120) NOT NULL,
    `acao` VARCHAR(120) NOT NULL,
    `mensagem` VARCHAR(255) NOT NULL,
    `detalhes` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `userAgent` VARCHAR(255) NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LogSistema_nivel_idx`(`nivel`),
    INDEX `LogSistema_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Sessao` ADD CONSTRAINT `Sessao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `MfaChallenge` ADD CONSTRAINT `MfaChallenge_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Dps` ADD CONSTRAINT `Dps_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Dps` ADD CONSTRAINT `Dps_tomadorId_fkey` FOREIGN KEY (`tomadorId`) REFERENCES `Tomador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Dps` ADD CONSTRAINT `Dps_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotaFiscal` ADD CONSTRAINT `NotaFiscal_dpsId_fkey` FOREIGN KEY (`dpsId`) REFERENCES `Dps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotaFiscal` ADD CONSTRAINT `NotaFiscal_prestadorId_fkey` FOREIGN KEY (`prestadorId`) REFERENCES `Prestador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotaFiscal` ADD CONSTRAINT `NotaFiscal_tomadorId_fkey` FOREIGN KEY (`tomadorId`) REFERENCES `Tomador`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `NotaDocumento` ADD CONSTRAINT `NotaDocumento_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `NotaFiscal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `LogSistema` ADD CONSTRAINT `LogSistema_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

