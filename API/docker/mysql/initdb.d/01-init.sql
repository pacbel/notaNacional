-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS `NFSeDB` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criação do usuário e concessão de permissões
CREATE USER IF NOT EXISTS 'nfse_user'@'%' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON `NFSeDB`.* TO 'nfse_user'@'%';
FLUSH PRIVILEGES;

-- Usar o banco de dados
USE `NFSeDB`;

-- Tabelas serão criadas pelo Entity Framework através das migrações
-- Este arquivo é apenas para configuração inicial do banco de dados
