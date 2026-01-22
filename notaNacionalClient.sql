-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: internos_mysql:3306
-- Tempo de geração: 22/01/2026 às 17:43
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
  `tpAmb` int NOT NULL DEFAULT '2',
  `pTotTribFed` decimal(5,2) NOT NULL DEFAULT '0.00',
  `pTotTribEst` decimal(5,2) NOT NULL DEFAULT '0.00',
  `pTotTribMun` decimal(5,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `ConfiguracaoDps`
--

INSERT INTO `ConfiguracaoDps` (`id`, `nomeSistema`, `versaoAplicacao`, `ambientePadrao`, `seriePadrao`, `emailRemetente`, `robotClientId`, `robotClientSecret`, `robotTokenCacheMinutos`, `mfaCodigoExpiracaoMinutos`, `enviarNotificacaoEmailPrestador`, `ativo`, `createdAt`, `updatedAt`, `ambGer`, `cStat`, `dhProc`, `procEmi`, `tpEmis`, `tpImunidade`, `tpRetISSQN`, `tribISSQN`, `xLocEmi`, `xLocPrestacao`, `numeroInicialDps`, `prestadorId`, `opSimpNac`, `regEspTrib`, `tpAmb`, `pTotTribFed`, `pTotTribEst`, `pTotTribMun`) VALUES
('9856705a-e4dc-42e1-b577-6a5ab881b83e', 'NotaClient', '1.0.0', 'HOMOLOGACAO', 1, NULL, 'rc-2ed6be-aef5d6fac2b64e0c88e3e1a71fa60525', 'zYn1voqZETCItqJhCzOPEIFkMTsz-4GCynoFwWYuKarwLBGNpbBVD0UtsjboXT4N', 50, 10, 1, 1, '2026-01-21 13:30:19.914', '2026-01-22 17:41:08.872', 2, 100, NULL, 1, 1, 0, 1, 1, '3106200', '3106200', 81, '2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba', 1, 0, 2, 3.65, 0.00, 2.50),
('b67cba75-3425-4c8d-b0c4-07d2c9e3f98f', 'NotaClient', '1.0.0', 'HOMOLOGACAO', 1, NULL, 'rc-ea8ed3-d287fb28d4074ed6b9453ca2b2cb828f', 'bal6OzdeTp_kt0EZl95wwIYpDZvIltelUxPqvKdZdMe2Jf6N9YqyXW3cRXisuuic', 50, 10, 1, 1, '2026-01-21 00:52:58.568', '2026-01-21 12:13:48.775', 2, 100, NULL, 1, 1, 0, 1, 1, '3106200', '3106200', 20, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 1, 0, 2, 0.00, 0.00, 0.00);

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

--
-- Despejando dados para a tabela `Dps`
--

INSERT INTO `Dps` (`id`, `numero`, `serie`, `competencia`, `dataEmissao`, `ambiente`, `status`, `prestadorId`, `tomadorId`, `servicoId`, `xmlGerado`, `observacoes`, `ativo`, `createdAt`, `updatedAt`, `codigoLocalEmissao`, `dataEnvio`, `dataRetorno`, `digestValue`, `identificador`, `jsonEntrada`, `mensagemErro`, `protocolo`, `tipoEmissao`, `versao`, `versaoAplicacao`, `xmlAssinado`) VALUES
('99394717-4fba-43fe-8df8-4c6c282e131e', 80, 1, '2026-01-22 17:41:03.023', '2026-01-22 17:41:03.023', 'HOMOLOGACAO', 'ENVIADO', '2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba', 'c3903cc3-ae1c-4dfa-a31d-fd94862cbd4a', 'e3d0c5f8-4066-4823-8a87-7a73dea0e466', '<?xml version=\"1.0\" encoding=\"UTF-8\"?><DPS versao=\"1.01\" xmlns=\"http://www.sped.fazenda.gov.br/nfse\"><infDPS Id=\"DPS310620020506573600016100001000000000000080\"><tpAmb>2</tpAmb><dhEmi>2026-01-22T14:41:03-03:00</dhEmi><verAplic>1.0.0</verAplic><serie>00001</serie><nDPS>80</nDPS><dCompet>2026-01-22</dCompet><tpEmit>1</tpEmit><cLocEmi>3106200</cLocEmi><prest><CNPJ>05065736000161</CNPJ><fone>3131919870</fone><email>carlos.pacheco@pacbel.com.br</email><regTrib><opSimpNac>1</opSimpNac><regEspTrib>0</regEspTrib></regTrib></prest><toma><CPF>76798259634</CPF><xNome>CARLOS ROBERTO PACHECO LIMA</xNome><end><endNac><cMun>3106200</cMun><CEP>30882360</CEP></endNac><xLgr>Ruh Hudson Magalhaes Marques</xLgr><nro>208</nro><xCpl>A</xCpl><xBairro>Serrano</xBairro></end><fone>31996800154</fone><email>carlos.pacheco@pacbel.com.br</email></toma><serv><locPrest><cLocPrestacao>3106200</cLocPrestacao></locPrest><cServ><cTribNac>010301</cTribNac><cTribMun>001</cTribMun><xDescServ>LICENCIAMENTO OU CESSAO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR</xDescServ><cNBS>115090000</cNBS></cServ></serv><valores><vServPrest><vServ>1800.00</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun><totTrib><pTotTrib><pTotTribFed>3.65</pTotTribFed><pTotTribEst>0.00</pTotTribEst><pTotTribMun>2.50</pTotTribMun></pTotTrib></totTrib></trib></valores></infDPS></DPS>', '', 1, '2026-01-22 17:41:08.685', '2026-01-22 17:42:17.453', '3106200', '2026-01-22 17:42:17.433', '2026-01-22 17:42:17.433', NULL, '2ed6be3e-900135', '{\"prestador\":{\"id\":\"2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba\",\"nomeFantasia\":\"SISTEMA VIRTUAL\",\"cnpj\":\"05065736000161\",\"codigoMunicipio\":\"3106200\",\"cidade\":\"\",\"estado\":\"\"},\"tomador\":{\"id\":\"c3903cc3-ae1c-4dfa-a31d-fd94862cbd4a\",\"nome\":\"CARLOS ROBERTO PACHECO LIMA\",\"documento\":\"76798259634\",\"cidade\":\"Belo Horizonte\",\"estado\":\"MG\"},\"servico\":{\"id\":\"e3d0c5f8-4066-4823-8a87-7a73dea0e466\",\"descricao\":\"LICENCIAMENTO OU CESSAO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR\",\"valorUnitario\":1800,\"codigoTributacaoMunicipal\":\"001\",\"codigoTributacaoNacional\":\"010301\",\"codigoNbs\":\"115090000\"},\"competencia\":\"2026-01-22T17:41:03.023Z\",\"dataEmissao\":\"2026-01-22T17:41:03.023Z\",\"configuracao\":{\"xLocEmi\":\"3106200\",\"xLocPrestacao\":\"3106200\",\"verAplic\":\"1.0.0\",\"tpAmb\":2,\"ambGer\":2,\"tpEmis\":1,\"procEmi\":1,\"cStat\":100,\"opSimpNac\":1,\"regEspTrib\":0,\"tribISSQN\":1,\"tpImunidade\":0,\"tpRetISSQN\":1},\"observacoes\":\"\"}', NULL, '31062002205065736000161000000000009326011037881815', 1, '1.00', '1.0.0', '<?xml version=\"1.0\" encoding=\"UTF-8\"?><DPS versao=\"1.01\" xmlns=\"http://www.sped.fazenda.gov.br/nfse\"><infDPS Id=\"DPS310620020506573600016100001000000000000080\"><tpAmb>2</tpAmb><dhEmi>2026-01-22T14:41:03-03:00</dhEmi><verAplic>1.0.0</verAplic><serie>00001</serie><nDPS>80</nDPS><dCompet>2026-01-22</dCompet><tpEmit>1</tpEmit><cLocEmi>3106200</cLocEmi><prest><CNPJ>05065736000161</CNPJ><fone>3131919870</fone><email>carlos.pacheco@pacbel.com.br</email><regTrib><opSimpNac>1</opSimpNac><regEspTrib>0</regEspTrib></regTrib></prest><toma><CPF>76798259634</CPF><xNome>CARLOS ROBERTO PACHECO LIMA</xNome><end><endNac><cMun>3106200</cMun><CEP>30882360</CEP></endNac><xLgr>Ruh Hudson Magalhaes Marques</xLgr><nro>208</nro><xCpl>A</xCpl><xBairro>Serrano</xBairro></end><fone>31996800154</fone><email>carlos.pacheco@pacbel.com.br</email></toma><serv><locPrest><cLocPrestacao>3106200</cLocPrestacao></locPrest><cServ><cTribNac>010301</cTribNac><cTribMun>001</cTribMun><xDescServ>LICENCIAMENTO OU CESSAO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR</xDescServ><cNBS>115090000</cNBS></cServ></serv><valores><vServPrest><vServ>1800.00</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun><totTrib><pTotTrib><pTotTribFed>3.65</pTotTribFed><pTotTribEst>0.00</pTotTribEst><pTotTribMun>2.50</pTotTribMun></pTotTrib></totTrib></trib></valores></infDPS><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /><SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\" /><Reference URI=\"#DPS310620020506573600016100001000000000000080\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\" /><DigestValue>SGdkncHq46NJLmcCTLnpXrIjNppwQhBkzDNUxpdOKSI=</DigestValue></Reference></SignedInfo><SignatureValue>PFFsMC+F30XpI+o0o/p7YayVehxkkS2/oW9aRzITfjjzZF7qAsK+1uNhBRjeG0FEdrSdc7sSFI7bRBlq2cqEXLLmy8Ws/30zTj1IyZ53LXSD0cWIn+AjXT2x8ihqT5cdiwz3ysLsU5MnzbWVmjLMnjefIaT7SAjw8uAptc1BD1ansUlcefq09AW8ZDoLOVIW5How/HwKR4gzTWxhOYXqGt3OTVVpjcetFjJNxd1V7FfN+4fdv0kVLVK68UkqNr+ra2SFnVZjSr+INUFGFzH/DDD4nRk1OwS4pp3JRVw3oHjDr/sEKshOKsLHvH5LqQ8Y4/C4BPg11FDiCoHwsOq7QQ==</SignatureValue><KeyInfo><X509Data><X509Certificate>MIIHczCCBVugAwIBAgIIEd4lBhI6uwQwDQYJKoZIhvcNAQELBQAwdTELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxNjA0BgNVBAsTLVNlY3JldGFyaWEgZGEgUmVjZWl0YSBGZWRlcmFsIGRvIEJyYXNpbCAtIFJGQjEZMBcGA1UEAxMQQUMgU09MVVRJIFJGQiBWNTAeFw0yNTA2MTIxMzA1MDBaFw0yNjA2MTIxMzA1MDBaMIIBCjELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxCzAJBgNVBAgTAk1HMRcwFQYDVQQHEw5CZWxvIEhvcml6b250ZTEZMBcGA1UECxMQVmlkZW9jb25mZXJlbmNpYTEXMBUGA1UECxMOMDk0NjE2NDcwMDAxOTUxNjA0BgNVBAsTLVNlY3JldGFyaWEgZGEgUmVjZWl0YSBGZWRlcmFsIGRvIEJyYXNpbCAtIFJGQjEWMBQGA1UECxMNUkZCIGUtQ05QSiBBMTE8MDoGA1UEAxMzUEFDQkVMIFBST0dSQU1BUyBQRVJTT05BTElaQURPUyBMVERBOjA1MDY1NzM2MDAwMTYxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvrKicCFjykZ7k0TT39mr2C+IuwfBo+h/bjEsYYyjgITUv20UA6Zz0fmLdwvwRmomoItnoZRo2r63a6cXhjyq6s1257O2Wr2V/Wx4cEbQlHrHxK0ulN7+yCuoKkSDTdk2mlKgyAO/65I4OTXR2VMqyfW3ntp/BZN/953peJZTts5Z8cSPGOm0o+7PxQENJT6e6o7TYMOQMzo5gb9MDjrmiWWuh4Maq7CDH9FunBb4S1PhdcdGGXAddk69irvBQ9AsS2zLS9XjSy8YxNTdgXJGxMLzCiiXWJasPdHbmo1fWxCSiDvceEq4o5PgRRkuqQuRJ2X30m9JGosp8lKt29OYMQIDAQABo4ICbjCCAmowCQYDVR0TBAIwADAfBgNVHSMEGDAWgBT88oIAsvi9n9WC22AgJzM8wr7MmTBPBggrBgEFBQcBAQRDMEEwPwYIKwYBBQUHMAKGM2h0dHA6Ly9jY2QuYWNzb2x1dGkuY29tLmJyL2xjci9hYy1zb2x1dGktcmZiLXY1LnA3YjCBvwYDVR0RBIG3MIG0gRxjYXJsb3MucGFjaGVjb0BwYWNiZWwuY29tLmJyoCYGBWBMAQMCoB0TG0NBUkxPUyBST0JFUlRPIFBBQ0hFQ08gTElNQaAZBgVgTAEDA6AQEw4wNTA2NTczNjAwMDE2MaA4BgVgTAEDBKAvEy0wOTAyMTk3NDc2Nzk4MjU5NjM0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDCgFwYFYEwBAwegDhMMMDAwMDAwMDAwMDAwMFgGA1UdIARRME8wTQYGYEwBAgEoMEMwQQYIKwYBBQUHAgEWNWh0dHA6Ly9jY2QuYWNzb2x1dGkuY29tLmJyL2RvY3MvZHBjLWFjLXNvbHV0aS1yZmIucGRmMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDCBgAYDVR0fBHkwdzA5oDegNYYzaHR0cDovL2NjZC5hY3NvbHV0aS5jb20uYnIvbGNyL2FjLXNvbHV0aS1yZmItdjUuY3JsMDqgOKA2hjRodHRwOi8vY2NkMi5hY3NvbHV0aS5jb20uYnIvbGNyL2FjLXNvbHV0aS1yZmItdjUuY3JsMB0GA1UdDgQWBBRhhFA2dobCNviF6ZZuS8bSJw8rgTAOBgNVHQ8BAf8EBAMCBeAwDQYJKoZIhvcNAQELBQADggIBAJSx1YkOebcdHYIz3IQW2aJDtRRD+2h8JmhxEo+qVTTbYzoDvxWXlmsTzb0MaFS2TwEfAaue8yKbl1mZTxBj/8vctA0HIE6HXvTfLxlzDRddgAnvyURuA5xNm1CGqCc0iVt5rM6+SDncGt2wuQhwNSF08zKrQLPxx7o9tg5QQo0a4AZ8bl5qvC5zmzzbf8iBxEzrKj44Ix8NRobIjmHP2Pm3Te8XbuMt+8jxGUpSouynKoZrwrAtU+8zHzfR9MrfvelE3J8sby99zD6aiBAvs8TQxqkG/FZWJHdPZCSdiRQeJHpm6LKioLF7YyKzJPyexkivj8v6/1N+nL6PSHzWlXY+MYlrGOfKe4EgcIA0eMu/A3kdsdDFq2MpZoGb/DS2T7XTM1tpVd95X/HmkfA9SdGENWMU4L4/BkQahyA4RY2es61EQkX1mzx3jBN6emNoT3AnRI8cpyBtiClVqYOEXCjMubiY+gdvc52C+GqWvdZ7GSVTfiEnfBu9Iz2ivqFHXu9w0avwpTQTcA3ZWjHyZm+v2mHcJHb9XtF7FxfSf4a+ZWhsG9kiBCdfGwh01GAq77gEvzaj8uoq+tMdCW3yYVVEax4fzECgppEBd7PjOmt7IbJ6Z9uRBHMeLcGQNsXd/YEzyzhn9djPO33b3j2CzkR3g1cme71syaSk/S32mB9y</X509Certificate></X509Data></KeyInfo></Signature></DPS>');

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

--
-- Despejando dados para a tabela `NotaDocumento`
--

INSERT INTO `NotaDocumento` (`id`, `notaFiscalId`, `tipo`, `conteudo`, `contentType`, `nomeArquivo`, `ativo`, `createdAt`, `updatedAt`) VALUES
('3af5df5f-fdc1-4dd6-884b-4a7873d8ed40', 'a2bbda8c-2563-4e99-a1ec-85b17147bfc9', 'NFSE_GZIP', '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', 'application/gzip', 'NFSe-.gz', 1, '2026-01-22 17:42:17.792', '2026-01-22 17:42:17.792'),
('cdbc2a10-9728-4f62-9842-5619a5c3d05a', 'a2bbda8c-2563-4e99-a1ec-85b17147bfc9', 'XML_NFSE', '<?xml version=\"1.0\" encoding=\"utf-8\"?><NFSe versao=\"1.01\" xmlns=\"http://www.sped.fazenda.gov.br/nfse\"><infNFSe Id=\"NFS31062002205065736000161000000000009326011037881815\"><xLocEmi>Belo Horizonte</xLocEmi><xLocPrestacao>Belo Horizonte</xLocPrestacao><nNFSe>93</nNFSe><cLocIncid>3106200</cLocIncid><xLocIncid>Belo Horizonte</xLocIncid><xTribNac>Processamento de dados, textos, imagens, vídeos, páginas eletrônicas, aplicativos e sistemas de informação, entre outros formatos, e congêneres.</xTribNac><xTribMun>Processamento de dados</xTribMun><xNBS>Serviços de processamento de dados </xNBS><verAplic>SefinNacional_1.6.0</verAplic><ambGer>2</ambGer><tpEmis>1</tpEmis><procEmi>1</procEmi><cStat>100</cStat><dhProc>2026-01-22T14:42:34-03:00</dhProc><nDFSe>828708</nDFSe><emit><CNPJ>05065736000161</CNPJ><xNome>PACBEL - PROGRAMAS PERSONALIZADOS LTDA</xNome><enderNac><xLgr>SOLANGE BERNARDES DECLIE</xLgr><nro>150</nro><xBairro>DIAMANTE</xBairro><cMun>3106200</cMun><UF>MG</UF><CEP>30627222</CEP></enderNac><fone>3187847599</fone><email>SUPORTE@SISTEMAVIRTUAL.COM.BR</email></emit><valores><vBC>1800.00</vBC><pAliqAplic>2.50</pAliqAplic><vISSQN>45.00</vISSQN><vLiq>1800.00</vLiq></valores><DPS versao=\"1.01\" xmlns=\"http://www.sped.fazenda.gov.br/nfse\"><infDPS Id=\"DPS310620020506573600016100001000000000000080\"><tpAmb>2</tpAmb><dhEmi>2026-01-22T14:41:03-03:00</dhEmi><verAplic>1.0.0</verAplic><serie>00001</serie><nDPS>80</nDPS><dCompet>2026-01-22</dCompet><tpEmit>1</tpEmit><cLocEmi>3106200</cLocEmi><prest><CNPJ>05065736000161</CNPJ><fone>3131919870</fone><email>carlos.pacheco@pacbel.com.br</email><regTrib><opSimpNac>1</opSimpNac><regEspTrib>0</regEspTrib></regTrib></prest><toma><CPF>76798259634</CPF><xNome>CARLOS ROBERTO PACHECO LIMA</xNome><end><endNac><cMun>3106200</cMun><CEP>30882360</CEP></endNac><xLgr>Ruh Hudson Magalhaes Marques</xLgr><nro>208</nro><xCpl>A</xCpl><xBairro>Serrano</xBairro></end><fone>31996800154</fone><email>carlos.pacheco@pacbel.com.br</email></toma><serv><locPrest><cLocPrestacao>3106200</cLocPrestacao></locPrest><cServ><cTribNac>010301</cTribNac><cTribMun>001</cTribMun><xDescServ>LICENCIAMENTO OU CESSAO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR</xDescServ><cNBS>115090000</cNBS></cServ></serv><valores><vServPrest><vServ>1800.00</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>1</tpRetISSQN></tribMun><totTrib><pTotTrib><pTotTribFed>3.65</pTotTribFed><pTotTribEst>0.00</pTotTribEst><pTotTribMun>2.50</pTotTribMun></pTotTrib></totTrib></trib></valores></infDPS><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /><SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\" /><Reference URI=\"#DPS310620020506573600016100001000000000000080\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\" /><DigestValue>SGdkncHq46NJLmcCTLnpXrIjNppwQhBkzDNUxpdOKSI=</DigestValue></Reference></SignedInfo><SignatureValue>PFFsMC+F30XpI+o0o/p7YayVehxkkS2/oW9aRzITfjjzZF7qAsK+1uNhBRjeG0FEdrSdc7sSFI7bRBlq2cqEXLLmy8Ws/30zTj1IyZ53LXSD0cWIn+AjXT2x8ihqT5cdiwz3ysLsU5MnzbWVmjLMnjefIaT7SAjw8uAptc1BD1ansUlcefq09AW8ZDoLOVIW5How/HwKR4gzTWxhOYXqGt3OTVVpjcetFjJNxd1V7FfN+4fdv0kVLVK68UkqNr+ra2SFnVZjSr+INUFGFzH/DDD4nRk1OwS4pp3JRVw3oHjDr/sEKshOKsLHvH5LqQ8Y4/C4BPg11FDiCoHwsOq7QQ==</SignatureValue><KeyInfo><X509Data><X509Certificate>MIIHczCCBVugAwIBAgIIEd4lBhI6uwQwDQYJKoZIhvcNAQELBQAwdTELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxNjA0BgNVBAsTLVNlY3JldGFyaWEgZGEgUmVjZWl0YSBGZWRlcmFsIGRvIEJyYXNpbCAtIFJGQjEZMBcGA1UEAxMQQUMgU09MVVRJIFJGQiBWNTAeFw0yNTA2MTIxMzA1MDBaFw0yNjA2MTIxMzA1MDBaMIIBCjELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxCzAJBgNVBAgTAk1HMRcwFQYDVQQHEw5CZWxvIEhvcml6b250ZTEZMBcGA1UECxMQVmlkZW9jb25mZXJlbmNpYTEXMBUGA1UECxMOMDk0NjE2NDcwMDAxOTUxNjA0BgNVBAsTLVNlY3JldGFyaWEgZGEgUmVjZWl0YSBGZWRlcmFsIGRvIEJyYXNpbCAtIFJGQjEWMBQGA1UECxMNUkZCIGUtQ05QSiBBMTE8MDoGA1UEAxMzUEFDQkVMIFBST0dSQU1BUyBQRVJTT05BTElaQURPUyBMVERBOjA1MDY1NzM2MDAwMTYxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvrKicCFjykZ7k0TT39mr2C+IuwfBo+h/bjEsYYyjgITUv20UA6Zz0fmLdwvwRmomoItnoZRo2r63a6cXhjyq6s1257O2Wr2V/Wx4cEbQlHrHxK0ulN7+yCuoKkSDTdk2mlKgyAO/65I4OTXR2VMqyfW3ntp/BZN/953peJZTts5Z8cSPGOm0o+7PxQENJT6e6o7TYMOQMzo5gb9MDjrmiWWuh4Maq7CDH9FunBb4S1PhdcdGGXAddk69irvBQ9AsS2zLS9XjSy8YxNTdgXJGxMLzCiiXWJasPdHbmo1fWxCSiDvceEq4o5PgRRkuqQuRJ2X30m9JGosp8lKt29OYMQIDAQABo4ICbjCCAmowCQYDVR0TBAIwADAfBgNVHSMEGDAWgBT88oIAsvi9n9WC22AgJzM8wr7MmTBPBggrBgEFBQcBAQRDMEEwPwYIKwYBBQUHMAKGM2h0dHA6Ly9jY2QuYWNzb2x1dGkuY29tLmJyL2xjci9hYy1zb2x1dGktcmZiLXY1LnA3YjCBvwYDVR0RBIG3MIG0gRxjYXJsb3MucGFjaGVjb0BwYWNiZWwuY29tLmJyoCYGBWBMAQMCoB0TG0NBUkxPUyBST0JFUlRPIFBBQ0hFQ08gTElNQaAZBgVgTAEDA6AQEw4wNTA2NTczNjAwMDE2MaA4BgVgTAEDBKAvEy0wOTAyMTk3NDc2Nzk4MjU5NjM0MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDCgFwYFYEwBAwegDhMMMDAwMDAwMDAwMDAwMFgGA1UdIARRME8wTQYGYEwBAgEoMEMwQQYIKwYBBQUHAgEWNWh0dHA6Ly9jY2QuYWNzb2x1dGkuY29tLmJyL2RvY3MvZHBjLWFjLXNvbHV0aS1yZmIucGRmMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDBDCBgAYDVR0fBHkwdzA5oDegNYYzaHR0cDovL2NjZC5hY3NvbHV0aS5jb20uYnIvbGNyL2FjLXNvbHV0aS1yZmItdjUuY3JsMDqgOKA2hjRodHRwOi8vY2NkMi5hY3NvbHV0aS5jb20uYnIvbGNyL2FjLXNvbHV0aS1yZmItdjUuY3JsMB0GA1UdDgQWBBRhhFA2dobCNviF6ZZuS8bSJw8rgTAOBgNVHQ8BAf8EBAMCBeAwDQYJKoZIhvcNAQELBQADggIBAJSx1YkOebcdHYIz3IQW2aJDtRRD+2h8JmhxEo+qVTTbYzoDvxWXlmsTzb0MaFS2TwEfAaue8yKbl1mZTxBj/8vctA0HIE6HXvTfLxlzDRddgAnvyURuA5xNm1CGqCc0iVt5rM6+SDncGt2wuQhwNSF08zKrQLPxx7o9tg5QQo0a4AZ8bl5qvC5zmzzbf8iBxEzrKj44Ix8NRobIjmHP2Pm3Te8XbuMt+8jxGUpSouynKoZrwrAtU+8zHzfR9MrfvelE3J8sby99zD6aiBAvs8TQxqkG/FZWJHdPZCSdiRQeJHpm6LKioLF7YyKzJPyexkivj8v6/1N+nL6PSHzWlXY+MYlrGOfKe4EgcIA0eMu/A3kdsdDFq2MpZoGb/DS2T7XTM1tpVd95X/HmkfA9SdGENWMU4L4/BkQahyA4RY2es61EQkX1mzx3jBN6emNoT3AnRI8cpyBtiClVqYOEXCjMubiY+gdvc52C+GqWvdZ7GSVTfiEnfBu9Iz2ivqFHXu9w0avwpTQTcA3ZWjHyZm+v2mHcJHb9XtF7FxfSf4a+ZWhsG9kiBCdfGwh01GAq77gEvzaj8uoq+tMdCW3yYVVEax4fzECgppEBd7PjOmt7IbJ6Z9uRBHMeLcGQNsXd/YEzyzhn9djPO33b3j2CzkR3g1cme71syaSk/S32mB9y</X509Certificate></X509Data></KeyInfo></Signature></DPS></infNFSe><Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#WithComments\" /><SignatureMethod Algorithm=\"http://www.w3.org/2001/04/xmldsig-more#rsa-sha256\" /><Reference URI=\"#NFS31062002205065736000161000000000009326011037881815\"><Transforms><Transform Algorithm=\"http://www.w3.org/2000/09/xmldsig#enveloped-signature\" /><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#WithComments\" /></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2001/04/xmlenc#sha256\" /><DigestValue>8owDDQXrnVcmG4XFCvAWKV3pmt/KBthYSgw3ns+CEgA=</DigestValue></Reference></SignedInfo><SignatureValue>AFnV61TVpACXH/nLWUB/bNit4PK2PsbKKrhfmKHwgujUvuqVaTBXRyESyW+KIGvC0k+p6bQ6C7wfr2rYafxpO0/LwYIpnwtZ3wrOcR2gvHXs1I2rN/BtHrnsFyM8xOnDASlHqkFcaJYfPg0UlKTGo/ZQ07FG+fqkrHjrBMXkAGfcureyHP+HnnErqrpWWtZNGQgtrvdrWvqG3t7FYHtcOpawrNbZZRC3jKBawxg3ls1i95s1C8b+3wAYEV+Z1SIuxED2cNOYnwhDScAkVb0VRhukz6UBB7GewPXqVf80Bz38XxL/uFvGxjayjACCv6cQwOC25a0fj9TVnZEbK2cS+w==</SignatureValue><KeyInfo><X509Data><X509Certificate>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</X509Certificate></X509Data></KeyInfo></Signature></NFSe>', 'application/xml', 'NFSe-.xml', 1, '2026-01-22 17:42:17.694', '2026-01-22 17:42:17.694');

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

--
-- Despejando dados para a tabela `NotaFiscal`
--

INSERT INTO `NotaFiscal` (`id`, `dpsId`, `prestadorId`, `tomadorId`, `ambiente`, `chaveAcesso`, `numero`, `codigoVerificacao`, `urlNfse`, `statusCode`, `rawResponseContentType`, `rawResponseContent`, `ativo`, `createdAt`, `updatedAt`) VALUES
('a2bbda8c-2563-4e99-a1ec-85b17147bfc9', '99394717-4fba-43fe-8df8-4c6c282e131e', '2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba', 'c3903cc3-ae1c-4dfa-a31d-fd94862cbd4a', 'HOMOLOGACAO', '31062002205065736000161000000000009326011037881815', '', NULL, NULL, 201, 'application/json; charset=utf-8', '{\"tipoAmbiente\":2,\"versaoAplicativo\":\"SefinNacional_1.6.0\",\"dataHoraProcessamento\":\"2026-01-22T14:42:34.4777475-03:00\",\"idDps\":\"NFS31062002205065736000161000000000009326011037881815\",\"chaveAcesso\":\"31062002205065736000161000000000009326011037881815\",\"nfseXmlGZipB64\":\"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\",\"alertas\":null}', 1, '2026-01-22 17:42:17.529', '2026-01-22 17:42:17.529');

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
('84b6cb5a-2539-4242-9280-e747edc1e79c', 'Processamento de dados', '001', '010101', '115090000', 1431.88, NULL, 0, 1, '2026-01-21 00:55:36.545', '2026-01-21 12:02:31.382', NULL, NULL, NULL, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71'),
('e3d0c5f8-4066-4823-8a87-7a73dea0e466', 'LICENCIAMENTO OU CESSAO DE DIREITOS DE USO DE PROGRAMAS DE COMPUTADOR', '001', '010301', '115090000', 1800.00, 2.50, 0, 1, '2026-01-21 13:33:48.104', '2026-01-21 14:35:18.426', NULL, NULL, NULL, '2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba');

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
('2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba', 'ROBOT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyb2JvdDpyYy0yZWQ2YmUtYWVmNWQ2ZmFjMmI2NGUwYzg4ZTNlMWE3MWZhNjA1MjUiLCJjbGllbnRfaWQiOiJyYy0yZWQ2YmUtYWVmNWQ2ZmFjMmI2NGUwYzg4ZTNlMWE3MWZhNjA1MjUiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJSb2JvdCIsInByZXN0YWRvcklkIjoiMmVkNmJlM2UtZTdiMi00ZTRiLWI4ODctY2ZjY2RjZDQ3M2JhIiwic2NvcGUiOiJuZnNlLmNhbmNlbGFyIG5mc2UuY2VydGlmaWNhZG9zIG5mc2UuZGFuZnNlIG5mc2UuZW1pdGlyIG5mc2UuZW1haWwiLCJleHAiOjE3NjkxMDUyNjEsImlzcyI6IkFQSV9ORlNlIiwiYXVkIjoiQVBJX05GU2UifQ.ysd8WYiEThuopPFhDI0K4cOtdRV4N31wiUTM1tcbQ9I', '2026-01-22 18:07:41.000', 1, '2026-01-21 13:31:59.865', '2026-01-22 17:37:24.826'),
('ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 'ROBOT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyb2JvdDpyYy1lYThlZDMtZDI4N2ZiMjhkNDA3NGVkNmI5NDUzY2EyYjJjYjgyOGYiLCJjbGllbnRfaWQiOiJyYy1lYThlZDMtZDI4N2ZiMjhkNDA3NGVkNmI5NDUzY2EyYjJjYjgyOGYiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJSb2JvdCIsInByZXN0YWRvcklkIjoiZWE4ZWQzZDgtYjk1Ni00MGFmLThmNmMtMDY2YWEwZTJjZDcxIiwic2NvcGUiOiJuZnNlLmNhbmNlbGFyIG5mc2UuY2VydGlmaWNhZG9zIG5mc2UuZGFuZnNlIG5mc2UuZW1pdGlyIG5mc2UuZW1haWwiLCJleHAiOjE3Njg5OTg3NTEsImlzcyI6IkFQSV9ORlNlIiwiYXVkIjoiQVBJX05GU2UifQ.0TiASTIGsZZbJ30vihm5Arrl0sK3A0wIEEbZIwB_w70', '2026-01-21 12:32:31.000', 1, '2026-01-21 00:53:25.877', '2026-01-21 12:02:17.029');

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
('9e5ba80f-64da-42ac-a92c-3f0db36b21a2', 'CPF', '76798259634', 'CARLOS ROBERTO PACHECO LIMA', 'carlos.pacheco@pacbel.com.br', '31996800154', NULL, '3106200', 'Belo Horizonte', 'MG', '30882360', 'Rua Hudson Magalhaes Marques', '208', 'A', 'Serrano', 1, '2026-01-21 00:54:45.787', '2026-01-21 00:54:45.787', NULL, NULL, NULL, NULL, 'ea8ed3d8-b956-40af-8f6c-066aa0e2cd71', 'NACIONAL'),
('c3903cc3-ae1c-4dfa-a31d-fd94862cbd4a', 'CPF', '76798259634', 'CARLOS ROBERTO PACHECO LIMA', 'carlos.pacheco@pacbel.com.br', '31996800154', NULL, '3106200', 'Belo Horizonte', 'MG', '30882360', 'Ruh Hudson Magalhães Marques', '208', 'A', 'Serrano', 1, '2026-01-21 13:57:00.395', '2026-01-21 13:57:00.395', NULL, NULL, NULL, NULL, '2ed6be3e-e7b2-4e4b-b887-cfccdcd473ba', 'NACIONAL');

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
('00018c73-a09c-4106-afae-a8978caf4662', '3a5197f87c141e0db0ad99a0c5eb5507c88b19a65dca5d91a24d0073cff640a9', '2026-01-21 13:38:34.098', '20260116221744_add_configuracao_campos_nfse', '', NULL, '2026-01-21 13:38:34.098', 0),
('0455bdf1-da16-4782-a55c-f89c1816ac3a', '234fd1a1711fd6b64878e9567b53ccca92d2f2fd56bb86d1912f7633da4b2049', '2026-01-21 00:44:13.205', '20260114191000_add_numero_inicial_dps', NULL, NULL, '2026-01-21 00:44:13.071', 1),
('0520d687-954d-4351-82f3-0c90c46edc25', '1988883e5a6859c2cb56871970338fdd7b582cbeec53a13f74e85d3ce2f0ca8a', '2026-01-21 13:37:57.549', '20260116_remove_usuario_tables', '', NULL, '2026-01-21 13:37:57.549', 0),
('0605444c-3906-45bd-aac2-0e013f0a756a', '4bea701e2fe06e01129e0a30161349c8db88603ec1cc1d6d3ed1e72dfa713a3c', '2026-01-21 00:44:13.845', '20260116181709_remove_prestador_certificado', NULL, NULL, '2026-01-21 00:44:13.769', 1),
('0abf7527-be45-4a19-88e1-8366df4fede2', 'f148fa2e5871ad39b4d011061db94fb912401716246b41ce551ab2f6af7f7ff2', '2026-01-21 13:37:45.697', '20260116_add_prestador_id_to_tables', '', NULL, '2026-01-21 13:37:45.697', 0),
('30a698f1-14a1-4041-b433-50d8db4d1c3a', '72f7552f6f8f74c1019e953e3d2aa03efa4d2fcd6d297d851e5df8f07042b48b', '2026-01-21 00:44:12.147', '20260108184822_init', NULL, NULL, '2026-01-21 00:44:11.456', 1),
('468716b4-d3e8-4ce7-bef2-332158bae0ed', '7eb538fb3fc03dfab652b3c1a9d98f01c62ac71a35583bfef4532f8ec061615d', '2026-01-21 00:44:12.279', '20260109170757_increase_token_length', NULL, NULL, '2026-01-21 00:44:12.179', 1),
('5c7bcf28-9784-46d7-af83-fef1e541e1b0', 'e94bf865d397564f573737b3f9a6c32cb857af6cd91518f948f39e11f76341f3', '2026-01-21 13:38:07.822', '20260120224603_add_tomador_tipos', '', NULL, '2026-01-21 13:38:07.822', 0),
('67455189-0b42-49d9-97cf-90600bb0e0b8', 'dd076c2b9602e680746a7478a66106819cf938f6c37e0ac8e81f60edad7899f7', '2026-01-21 00:44:13.054', '20260109231209_add_campos_config_dps', NULL, NULL, '2026-01-21 00:44:12.294', 1),
('6bf2ee44-d33a-444d-813d-d3621f3c707c', 'afb0a592b20de80988f549a3b078703171215af6d7fd9b4d73467d6e3e46ba11', '2026-01-21 13:43:09.579', '20260121_add_ptottrib_manual', '', NULL, '2026-01-21 13:43:09.579', 0),
('7eb828a5-f498-4bfe-a486-e5e59d65afea', 'f2fc3db4183a920ae0baf750276b776a264ff9518ec7e18b22c2a5762b7c215a', '2026-01-21 00:44:13.665', '20260116150520_prestador_configuracao', NULL, NULL, '2026-01-21 00:44:13.577', 1),
('a6642f6c-7c9d-4e46-aa50-f3b1fed91e7f', 'b186a0ab667bd012b073ba39a720da7064d1f65dca7d33eea3cb8ef201973f46', '2026-01-21 00:44:13.561', '20260116150058_add_prestador_id_to_configuracao', NULL, NULL, '2026-01-21 00:44:13.221', 1),
('a6778a28-6637-4af6-88ef-09ccf02d38db', '3a5197f87c141e0db0ad99a0c5eb5507c88b19a65dca5d91a24d0073cff640a9', NULL, '20260116221744_add_configuracao_campos_nfse', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20260116221744_add_configuracao_campos_nfse\n\nDatabase error code: 1091\n\nDatabase error:\nCan\'t DROP \'Servico_prestadorId_fkey\'; check that column/key exists\n\nPlease check the query number 6 from the migration file.\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name=\"20260116221744_add_configuracao_campos_nfse\"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:106\n   1: schema_core::commands::apply_migrations::Applying migration\n           with migration_name=\"20260116221744_add_configuracao_campos_nfse\"\n             at schema-engine\\core\\src\\commands\\apply_migrations.rs:91\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:226', '2026-01-21 13:38:34.061', '2026-01-21 00:44:13.860', 0);

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
