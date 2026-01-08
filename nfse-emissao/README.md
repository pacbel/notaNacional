# Sistema de Emissão de NFSe

Este sistema foi desenvolvido para facilitar a emissão, consulta e gerenciamento de Notas Fiscais de Serviço Eletrônicas (NFSe) para prestadores de serviços.

## Funcionalidades Principais

- Cadastro e gestão de prestadores de serviços
- Cadastro e gestão de tomadores de serviços
- Cadastro e gestão de serviços
- Emissão de NFSe
- Consulta de NFSe
- Cancelamento de NFSe
- Gestão de usuários com diferentes níveis de acesso
- Relatórios gerenciais
- Upload de certificados digitais e logomarcas

## Tecnologias Utilizadas

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Autenticação**: JWT (JSON Web Tokens)

## Requisitos

- Node.js 18 ou superior
- PostgreSQL 12 ou superior
- NPM 8 ou superior

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nfse_emissao"
JWT_SECRET="sua_chave_secreta_para_jwt"
NEXT_PUBLIC_AUTH_KEY="chave_de_autenticacao_para_apis"
```

4. Execute as migrações do banco de dados:

```bash
npx prisma migrate dev
```

5. Execute o seed para popular o banco de dados com dados iniciais (opcional):

```bash
npx prisma db seed
```

## Execução do Projeto

### Ambiente de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

### Ambiente de Produção

Para gerar uma build de produção:

```bash
npm run build
```

Para iniciar o servidor de produção:

```bash
npm start
```

## Estrutura do Projeto

- `/src/app`: Componentes e páginas da aplicação
- `/src/app/api`: Endpoints da API
- `/src/components`: Componentes reutilizáveis
- `/src/contexts`: Contextos React (autenticação, etc.)
- `/src/lib`: Bibliotecas e utilitários
- `/src/utils`: Funções utilitárias
- `/prisma`: Esquema e migrações do banco de dados
- `/public`: Arquivos estáticos

## Endpoints da API

O sistema disponibiliza diversos endpoints para integração com outros sistemas:

- `/api/authorization`: Autenticação
- `/api/nfse/emitir-nfse-direct`: Emissão de NFSe
- `/api/nfse/consultar-nfse`: Consulta de NFSe
- `/api/nfse/cancelar-nfse`: Cancelamento de NFSe
- `/api/nfse/consultar-lote-rps`: Consulta de Lote RPS
- `/api/nfse/consultar-nfse-por-rps`: Consulta de NFSe por RPS
- `/api/nfse/consultar-situacao-lote-rps`: Consulta de Situação do Lote RPS

## Perfis de Usuário

- **Master**: Acesso completo ao sistema e a todos os prestadores
- **Administrador**: Acesso completo ao prestador ao qual está vinculado
- **Operador**: Acesso limitado para operações básicas no prestador ao qual está vinculado

## Boas Práticas de Desenvolvimento

Este projeto segue as melhores práticas de desenvolvimento:

- Código limpo e organizado
- Tipagem forte com TypeScript
- Componentes reutilizáveis
- Separação de responsabilidades
- Padrão de codificação UTF-8

## Suporte

Para suporte ou dúvidas, entre em contato com a equipe de desenvolvimento.
