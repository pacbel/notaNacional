-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: internos_mysql:3306
-- Tempo de geração: 21/01/2026 às 00:56
-- Versão do servidor: 9.5.0
-- Versão do PHP: 8.2.27

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `notaNacionalClient`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `ConfiguracaoDps`
--

CREATE TABLE `ConfiguracaoDps` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomeSistema` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `versaoAplicacao` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambientePadrao` enum('PRODUCAO','HOMOLOGACAO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOMOLOGACAO',
  `seriePadrao` int NOT NULL DEFAULT '1',
  `emailRemetente` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `robotClientId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `robotClientSecret` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `robotTokenCacheMinutos` int NOT NULL DEFAULT '50',
  `mfaCodigoExpiracaoMinutos` int NOT NULL DEFAULT '10',
  `enviarNotificacaoEmailPrestador` tinyint(1) NOT NULL DEFAULT '1',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `ambGer` int NOT NULL DEFAULT '2',
  `cStat` int NOT NULL DEFAULT '100',
  `dhProc` datetime(3) DEFAULT NULL,
  `procEmi` int NOT NULL DEFAULT '1',
  `tpEmis` int NOT NULL DEFAULT '1',
  `tpImunidade` int NOT NULL DEFAULT '0',
  `tpRetISSQN` int NOT NULL DEFAULT '1',
  `tribISSQN` int NOT NULL DEFAULT '1',
  `xLocEmi` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `xLocPrestacao` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numeroInicialDps` int NOT NULL DEFAULT '1',
  `prestadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `opSimpNac` int NOT NULL DEFAULT '1',
  `regEspTrib` int NOT NULL DEFAULT '0',
  `tpAmb` int NOT NULL DEFAULT '2'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `ConfiguracaoDps`
--

INSERT INTO `ConfiguracaoDps` (`id`, `nomeSistema`, `versaoAplicacao`, `ambientePadrao`, `seriePadrao`, `emailRemetente`, `robotClientId`, `robotClientSecret`, `robotTokenCacheMinutos`, `mfaCodigoExpiracaoMinutos`, `enviarNotificacaoEmailPrestador`, `ativo`, `createdAt`, `updatedAt`, `ambGer`, `cStat`, `dhProc`, `procEmi`, `tpEmis`, `tpImunidade`, `tpRetISSQN`, `tribISSQN`, `xLocEmi`, `xLocPrestacao`, `numeroInicialDps`, `prestadorId`, `opSimpNac`, `regEspTrib`, `tpAmb`) VALUES
('b67cba75-3425-4c8d-b0c4-07d2c9e3f98f', 'NotaClient', '1.0.0', 'HOMOLOGACAO', 1, NULL, 'rc-ea8ed3-d287fb28d4074ed6b9453ca2b2cb828f', 'bal6OzdeTp_kt0EZl95wwIYpDZvIltelUxPqvKdZdMe2Jf6N9YqyXW3cRXisuuic', 50, 10, 1, 1, '2026-01-21 00:52:58.568', '2026-01-21 00:55:47.648', 2, 100, NULL, 1, 1, 0, 1, 1, '3106200', '3106200', 19, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 1, 0, 2);

-- --------------------------------------------------------

--
-- Estrutura para tabela `Dps`
--

CREATE TABLE `Dps` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` int NOT NULL,
  `serie` int NOT NULL,
  `competencia` datetime(3) NOT NULL,
  `dataEmissao` datetime(3) NOT NULL,
  `ambiente` enum('PRODUCAO','HOMOLOGACAO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOMOLOGACAO',
  `status` enum('RASCUNHO','ASSINADO','ENVIADO','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RASCUNHO',
  `prestadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tomadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `servicoId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `xmlGerado` longtext COLLATE utf8mb4_unicode_ci,
  `observacoes` longtext COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `codigoLocalEmissao` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dataEnvio` datetime(3) DEFAULT NULL,
  `dataRetorno` datetime(3) DEFAULT NULL,
  `digestValue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identificador` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jsonEntrada` longtext COLLATE utf8mb4_unicode_ci,
  `mensagemErro` longtext COLLATE utf8mb4_unicode_ci,
  `protocolo` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipoEmissao` int NOT NULL,
  `versao` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `versaoAplicacao` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `xmlAssinado` longtext COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `LogSistema`
--

CREATE TABLE `LogSistema` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuarioId` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel` enum('INFO','AVISO','ERRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `origem` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `acao` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensagem` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalhes` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `userAgent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `NotaDocumento`
--

CREATE TABLE `NotaDocumento` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notaFiscalId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('XML_ASSINADO','XML_NFSE','NFSE_GZIP','DANFSE_PDF','OUTRO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `conteudo` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `contentType` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomeArquivo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `NotaFiscal`
--

CREATE TABLE `NotaFiscal` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dpsId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prestadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tomadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ambiente` enum('PRODUCAO','HOMOLOGACAO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'HOMOLOGACAO',
  `chaveAcesso` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigoVerificacao` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urlNfse` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statusCode` int DEFAULT NULL,
  `rawResponseContentType` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rawResponseContent` longtext COLLATE utf8mb4_unicode_ci,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `Servico`
--

CREATE TABLE `Servico` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigoTributacaoMunicipal` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigoTributacaoNacional` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `codigoNbs` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `valorUnitario` decimal(12,2) NOT NULL,
  `aliquotaIss` decimal(5,2) DEFAULT NULL,
  `issRetido` tinyint(1) NOT NULL DEFAULT '0',
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `pTotTribEst` decimal(12,2) DEFAULT NULL,
  `pTotTribFed` decimal(12,2) DEFAULT NULL,
  `pTotTribMun` decimal(12,2) DEFAULT NULL,
  `prestadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `Servico`
--

INSERT INTO `Servico` (`id`, `descricao`, `codigoTributacaoMunicipal`, `codigoTributacaoNacional`, `codigoNbs`, `valorUnitario`, `aliquotaIss`, `issRetido`, `ativo`, `createdAt`, `updatedAt`, `pTotTribEst`, `pTotTribFed`, `pTotTribMun`, `prestadorId`) VALUES
('84b6cb5a-2539-4242-9280-e747edc1e79c', 'Locação de imóvel não residencial – aluguel mensal - Competência 01/2026 Endereço do imóvel: Rua Ilha Grande, 555, Jardim Atlântico, Belo Horizonte - Sala Operação de locação de imóvel não residencial com contrato firmado até 31/12/2025. Aplicação da regra de transição do art. 487 da Lei Complementar nº 214/2025. IBS diferido. CBS 3,5% = Base aluguel R$ 1.431,88 x 3,5% = 50,12', '001', '990101', '110022000', 1431.88, NULL, 0, 1, '2026-01-21 00:55:36.545', '2026-01-21 00:55:36.545', NULL, NULL, NULL, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71');

-- --------------------------------------------------------

--
-- Estrutura para tabela `TokenIntegracao`
--

CREATE TABLE `TokenIntegracao` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('ROBOT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `TokenIntegracao`
--

INSERT INTO `TokenIntegracao` (`id`, `tipo`, `token`, `expiresAt`, `ativo`, `createdAt`, `updatedAt`) VALUES
('ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 'ROBOT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyb2JvdDpyYy1lYThlZDMtZDI4N2ZiMjhkNDA3NGVkNmI5NDUzY2EyYjJjYjgyOGYiLCJjbGllbnRfaWQiOiJyYy1lYThlZDMtZDI4N2ZiMjhkNDA3NGVkNmI5NDUzY2EyYjJjYjgyOGYiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJSb2JvdCIsInByZXN0YWRvcklkIjoiZWE4ZWQzZDgtYjk1Ni00MGFmLThmNmMtMDY2YWEwZTJjZDcxIiwic2NvcGUiOiJuZnNlLmNhbmNlbGFyIG5mc2UuY2VydGlmaWNhZG9zIG5mc2UuZGFuZnNlIG5mc2UuZW1pdGlyIG5mc2UuZW1haWwiLCJleHAiOjE3Njg5NTg2MjAsImlzcyI6IkFQSV9ORlNlIiwiYXVkIjoiQVBJX05GU2UifQ.5KGoDc2W6azPZc77zt4-dXUuscugM9mbxUzVuuocIWk', '2026-01-21 01:23:40.000', 1, '2026-01-21 00:53:25.877', '2026-01-21 00:53:25.877');

-- --------------------------------------------------------

--
-- Estrutura para tabela `Tomador`
--

CREATE TABLE `Tomador` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipoDocumento` enum('CPF','CNPJ') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documento` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nomeRazaoSocial` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inscricaoMunicipal` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigoMunicipio` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cidade` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cep` varchar(8) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logradouro` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `cidadeExterior` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigoPais` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigoPostalExterior` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estadoExterior` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prestadorId` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipoTomador` enum('NACIONAL','ESTRANGEIRO','ANONIMO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'NACIONAL'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `Tomador`
--

INSERT INTO `Tomador` (`id`, `tipoDocumento`, `documento`, `nomeRazaoSocial`, `email`, `telefone`, `inscricaoMunicipal`, `codigoMunicipio`, `cidade`, `estado`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `ativo`, `createdAt`, `updatedAt`, `cidadeExterior`, `codigoPais`, `codigoPostalExterior`, `estadoExterior`, `prestadorId`, `tipoTomador`) VALUES
('9e5ba80f-64da-42ac-a92c-3f0db36b21a2', 'CPF', '76798259634', 'CARLOS ROBERTO PACHECO LIMA', 'carlos.pacheco@pacbel.com.br', '31996800154', NULL, '3106200', 'Belo Horizonte', 'MG', '30882360', 'Rua Hudson Magalhaes Marques', '208', 'A', 'Serrano', 1, '2026-01-21 00:54:45.787', '2026-01-21 00:54:45.787', NULL, NULL, NULL, NULL, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 'NACIONAL');

-- --------------------------------------------------------

--
-- Estrutura para tabela `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('0455bdf1-da16-4782-a55c-f89c1816ac3a', '234fd1a1711fd6b64878e9567b53ccca92d2f2fd56bb86d1912f7633da4b2049', '2026-01-21 00:44:13.205', '20260114191000_add_numero_inicial_dps', NULL, NULL, '2026-01-21 00:44:13.071', 1),
('0605444c-3906-45bd-aac2-0e013f0a756a', '4bea701e2fe06e01129e0a30161349c8db88603ec1cc1d6d3ed1e72dfa713a3c', '2026-01-21 00:44:13.845', '20260116181709_remove_prestador_certificado', NULL, NULL, '2026-01-21 00:44:13.769', 1),
('30a698f1-14a1-4041-b433-50d8db4d1c3a', '72f7552f6f8f74c1019e953e3d2aa03efa4d2fcd6d297d851e5df8f07042b48b', '2026-01-21 00:44:12.147', '20260108184822_init', NULL, NULL, '2026-01-21 00:44:11.456', 1),
('468716b4-d3e8-4ce7-bef2-332158bae0ed', '7eb538fb3fc03dfab652b3c1a9d98f01c62ac71a35583bfef4532f8ec061615d', '2026-01-21 00:44:12.279', '20260109170757_increase_token_length', NULL, NULL, '2026-01-21 00:44:12.179', 1),
('67455189-0b42-49d9-97cf-90600bb0e0b8', 'dd076c2b9602e680746a7478a66106819cf938f6c37e0ac8e81f60edad7899f7', '2026-01-21 00:44:13.054', '20260109231209_add_campos_config_dps', NULL, NULL, '2026-01-21 00:44:12.294', 1),
('7eb828a5-f498-4bfe-a486-e5e59d65afea', 'f2fc3db4183a920ae0baf750276b776a264ff9518ec7e18b22c2a5762b7c215a', '2026-01-21 00:44:13.665', '20260116150520_prestador_configuracao', NULL, NULL, '2026-01-21 00:44:13.577', 1),
('a6642f6c-7c9d-4e46-aa50-f3b1fed91e7f', 'b186a0ab667bd012b073ba39a720da7064d1f65dca7d33eea3cb8ef201973f46', '2026-01-21 00:44:13.561', '20260116150058_add_prestador_id_to_configuracao', NULL, NULL, '2026-01-21 00:44:13.221', 1),
('a6778a28-6637-4af6-88ef-09ccf02d38db', '3a5197f87c141e0db0ad99a0c5eb5507c88b19a65dca5d91a24d0073cff640a9', NULL, '20260116221744_add_configuracao_campos_nfse', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260116221744_add_configuracao_campos_nfse\n\nDatabase error code: 1091\n\nDatabase error:\nCan\'t DROP \'Servico_prestadorId_fkey\'; check that column/key exists\n\nPlease check the query number 6 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260116221744_add_configuracao_campos_nfse\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20260116221744_add_configuracao_campos_nfse\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226', NULL, '2026-01-21 00:44:13.860', 0);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `ConfiguracaoDps`
--
ALTER TABLE `ConfiguracaoDps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ConfiguracaoDps_prestadorId_key` (`prestadorId`),
  ADD KEY `ConfiguracaoDps_prestadorId_idx` (`prestadorId`);

--
-- Índices de tabela `Dps`
--
ALTER TABLE `Dps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Dps_prestadorId_identificador_key` (`prestadorId`,`identificador`),
  ADD UNIQUE KEY `Dps_prestadorId_numero_serie_key` (`prestadorId`,`numero`,`serie`),
  ADD KEY `Dps_numero_serie_idx` (`numero`,`serie`),
  ADD KEY `Dps_prestadorId_idx` (`prestadorId`),
  ADD KEY `Dps_tomadorId_idx` (`tomadorId`),
  ADD KEY `Dps_ativo_idx` (`ativo`),
  ADD KEY `Dps_servicoId_fkey` (`servicoId`);

--
-- Índices de tabela `LogSistema`
--
ALTER TABLE `LogSistema`
  ADD PRIMARY KEY (`id`),
  ADD KEY `LogSistema_nivel_idx` (`nivel`),
  ADD KEY `LogSistema_createdAt_idx` (`createdAt`);

--
-- Índices de tabela `NotaDocumento`
--
ALTER TABLE `NotaDocumento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `NotaDocumento_notaFiscalId_idx` (`notaFiscalId`);

--
-- Índices de tabela `NotaFiscal`
--
ALTER TABLE `NotaFiscal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `NotaFiscal_dpsId_key` (`dpsId`),
  ADD KEY `NotaFiscal_chaveAcesso_idx` (`chaveAcesso`),
  ADD KEY `NotaFiscal_ambiente_idx` (`ambiente`),
  ADD KEY `NotaFiscal_ativo_idx` (`ativo`),
  ADD KEY `NotaFiscal_prestadorId_fkey` (`prestadorId`),
  ADD KEY `NotaFiscal_tomadorId_fkey` (`tomadorId`);

--
-- Índices de tabela `Servico`
--
ALTER TABLE `Servico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Servico_ativo_idx` (`ativo`),
  ADD KEY `Servico_prestadorId_idx` (`prestadorId`);

--
-- Índices de tabela `TokenIntegracao`
--
ALTER TABLE `TokenIntegracao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TokenIntegracao_tipo_idx` (`tipo`),
  ADD KEY `TokenIntegracao_expiresAt_idx` (`expiresAt`);

--
-- Índices de tabela `Tomador`
--
ALTER TABLE `Tomador`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Tomador_prestadorId_documento_key` (`prestadorId`,`documento`),
  ADD KEY `Tomador_documento_idx` (`documento`),
  ADD KEY `Tomador_ativo_idx` (`ativo`),
  ADD KEY `Tomador_prestadorId_idx` (`prestadorId`);

--
-- Índices de tabela `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `Dps`
--
ALTER TABLE `Dps`
  ADD CONSTRAINT `Dps_servicoId_fkey` FOREIGN KEY (`servicoId`) REFERENCES `Servico` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `Dps_tomadorId_fkey` FOREIGN KEY (`tomadorId`) REFERENCES `Tomador` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Restrições para tabelas `NotaDocumento`
--
ALTER TABLE `NotaDocumento`
  ADD CONSTRAINT `NotaDocumento_notaFiscalId_fkey` FOREIGN KEY (`notaFiscalId`) REFERENCES `NotaFiscal` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Restrições para tabelas `NotaFiscal`
--
ALTER TABLE `NotaFiscal`
  ADD CONSTRAINT `NotaFiscal_dpsId_fkey` FOREIGN KEY (`dpsId`) REFERENCES `Dps` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `NotaFiscal_tomadorId_fkey` FOREIGN KEY (`tomadorId`) REFERENCES `Tomador` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
