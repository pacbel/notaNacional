# Migração de Autenticação para API Externa

## Resumo
Todo o fluxo de autenticação e gerenciamento de usuários foi migrado do controle local (Prisma) para a API externa NFSe.

## Alterações Realizadas

### 1. Endpoints de Autenticação Atualizados

#### `/api/auth/login` (POST)
- **Antes**: Validava credenciais no banco local e criava desafio MFA
- **Agora**: Encaminha credenciais para `${NOTA_API_BASE_URL}/api/Auth/login`
- **Payload**: `{ email: string, senha: string }`

#### `/api/auth/mfa/verify` (POST)
- **Antes**: Validava código MFA no banco local e criava sessão
- **Agora**: Encaminha para `${NOTA_API_BASE_URL}/api/Auth/confirm-mfa`
- **Payload**: `{ email: string, codigo: string }`
- **Retorno**: Armazena `accessToken` em cookie de sessão

#### `/api/auth/password/forgot` (POST)
- **Antes**: Criava desafio MFA e enviava email localmente
- **Agora**: Encaminha para `${NOTA_API_BASE_URL}/api/Auth/forgot-password`
- **Payload**: `{ email: string }`

#### `/api/auth/password/reset` (POST)
- **Antes**: Validava código e atualizava senha no banco local
- **Agora**: Encaminha para `${NOTA_API_BASE_URL}/api/Auth/reset-password`
- **Payload**: `{ token: string, novaSenha: string }`

#### `/api/auth/logout` (POST)
- **Antes**: Invalidava sessão no banco local
- **Agora**: Apenas limpa cookie de sessão (API externa gerencia invalidação)

### 2. Gerenciamento de Usuários

Todos os endpoints de CRUD de usuários já estavam configurados para usar a API externa:
- `GET /api/usuarios` - Lista usuários (filtra por prestadorId do token)
- `POST /api/usuarios` - Cria usuário
- `GET /api/usuarios/:id` - Busca usuário
- `PUT /api/usuarios/:id` - Atualiza usuário
- `DELETE /api/usuarios/:id` - Remove usuário
- `PUT /api/usuarios/:id/senha` - Altera senha

### 3. Validação de Sessão

#### `getCurrentUser()` em `src/lib/auth.ts`
- **Antes**: Buscava sessão no banco local via `tokenHash`
- **Agora**: Decodifica JWT armazenado no cookie e valida expiração
- **Extração de dados**: 
  - `userId`: `sub || userId || id || nameid`
  - `userName`: `name || userName || unique_name`
  - `userEmail`: `email`

### 4. Prisma Schema

#### Removido:
- `enum UsuarioRole`
- `enum MfaChallengeMotivo`
- `model Usuario`
- `model Sessao`
- `model MfaChallenge`

#### Mantido:
- `model LogSistema` - Campo `usuarioId` mantido como String opcional (sem FK)

### 5. Migration Criada

**Arquivo**: `prisma/migrations/20260116_remove_usuario_tables/migration.sql`

```sql
-- Remove foreign key de LogSistema
ALTER TABLE `LogSistema` DROP FOREIGN KEY `LogSistema_usuarioId_fkey`;

-- Remove tabelas de usuários
DROP TABLE IF EXISTS `MfaChallenge`;
DROP TABLE IF EXISTS `Sessao`;
DROP TABLE IF EXISTS `Usuario`;
```

### 6. Componentes Atualizados

#### `src/components/auth/login-view.tsx`
- Campo `password` → `senha`
- MFA usa `email` e `codigo` ao invés de `challengeToken` e `code`

#### `src/components/auth/recover-password-view.tsx`
- Removidos campos `code` e `confirmPassword`
- Usa apenas `token` e `novaSenha`

### 7. Arquivos Limpos

#### `src/lib/security.ts`
- Removidas funções: `generateMfaCode()`, `generateSessionToken()`, `hashToken()`
- Mantido apenas comentário indicando migração

## Fluxo de Autenticação Atual

### Login
1. Usuário envia `email` e `senha` → `/api/auth/login`
2. API externa retorna indicação de MFA necessário
3. Usuário envia `email` e `codigo` → `/api/auth/mfa/verify`
4. API externa retorna `accessToken` (JWT)
5. Token armazenado em cookie `nota_session`

### Validação de Requisições
1. Middleware/função lê cookie `nota_session`
2. Decodifica JWT e valida expiração
3. Extrai informações do usuário do payload
4. Usa token para chamadas à API externa

### Gerenciamento de Usuários
1. Token de robot (`clientId` + `clientSecret`) obtém `prestadorId`
2. Todas operações de usuários filtradas por `prestadorId`
3. CRUD completo gerenciado pela API externa

## Variáveis de Ambiente Necessárias

```env
NOTA_API_BASE_URL=https://api.notanacional.com.br
ROBOT_CLIENT_ID=seu_client_id
ROBOT_CLIENT_SECRET=seu_client_secret
ROBOT_SCOPE=usuarios:read usuarios:write
```

## Próximos Passos

1. Executar migration: `npx prisma migrate deploy`
2. Gerar Prisma Client: `npx prisma generate`
3. Testar fluxo completo de autenticação
4. Verificar logs de erro na API externa
5. Validar extração correta do `prestadorId` do token

## Observações Importantes

- O `prestadorId` é extraído do token JWT do robot client
- Campos do JWT podem variar: `prestadorId`, `PrestadorId`, `prestador_id`, `idPrestador`, `IdPrestador`
- Sessões são gerenciadas exclusivamente pela API externa
- Cookie de sessão tem TTL de 12 horas (configurável em `SESSION_TTL_HOURS`)
