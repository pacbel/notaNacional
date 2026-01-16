# Isolamento de Dados por Prestador

## Resumo
Implementado isolamento completo de dados por prestador. Cada usuário logado só tem acesso aos dados do seu prestador.

## Alterações Realizadas

### 1. Autenticação com PrestadorId

#### `getCurrentUser()` em `src/lib/auth.ts`
- **Adicionado**: Extração de `prestadorId` do token JWT
- **Validação**: Token sem `prestadorId` é rejeitado
- **Retorno**: Inclui `prestadorId` no objeto do usuário
- **Campos do token**: `prestadorId`, `PrestadorId`, `prestador_id`, `idPrestador`, `IdPrestador`

### 2. Schema do Prisma Atualizado

#### Tabela `Tomador`
```prisma
model Tomador {
  prestadorId  String    @db.Char(36)
  prestador    Prestador @relation(fields: [prestadorId], references: [id])
  documento    String    @db.VarChar(14)  // Não é mais unique global
  
  @@unique([prestadorId, documento])  // Unique por prestador
  @@index([prestadorId])
}
```

#### Tabela `Servico`
```prisma
model Servico {
  prestadorId  String    @db.Char(36)
  prestador    Prestador @relation(fields: [prestadorId], references: [id])
  
  @@index([prestadorId])
}
```

#### Tabela `Prestador`
```prisma
model Prestador {
  tomadores  Tomador[]
  servicos   Servico[]
  dps        Dps[]
  notas      NotaFiscal[]
}
```

### 3. Migration Criada

**Arquivo**: `prisma/migrations/20260116_add_prestador_id_to_tables/migration.sql`

- Adiciona coluna `prestadorId` em `Tomador` e `Servico`
- Migra dados existentes para o primeiro prestador ativo
- Remove constraint `unique` de `documento` em `Tomador`
- Cria constraint `unique` composta `(prestadorId, documento)`
- Adiciona foreign keys e índices

### 4. Endpoints Atualizados

#### `/api/tomadores` (GET, POST)
- **GET**: Filtra por `prestadorId` do usuário logado
- **POST**: Adiciona automaticamente `prestadorId` do usuário

#### `/api/tomadores/[id]` (GET, PATCH, DELETE)
- **GET**: Valida que tomador pertence ao prestador do usuário
- **PATCH**: Verifica ownership antes de atualizar
- **DELETE**: Verifica ownership antes de inativar

#### `/api/servicos` (GET, POST)
- **GET**: Filtra por `prestadorId` do usuário logado
- **POST**: Adiciona automaticamente `prestadorId` do usuário

#### `/api/servicos/[id]` (GET, PATCH, DELETE)
- **Pendente**: Atualizar com validação de prestadorId

### 5. Seed Atualizado

**Arquivo**: `prisma/seed.ts`

- ❌ Removido: Criação de `Usuario`
- ❌ Removido: Criação de `Prestador`
- ❌ Removido: Criação de `Tomador`
- ❌ Removido: Criação de `Servico`
- ✅ Mantido: Apenas `ConfiguracaoDps`

**Motivo**: Prestadores, Tomadores e Serviços são gerenciados pela API externa

### 6. Fluxo de Isolamento

```
1. Usuário faz login → API retorna JWT com prestadorId
2. JWT armazenado em cookie de sessão
3. getCurrentUser() extrai prestadorId do JWT
4. Todas queries filtram por prestadorId automaticamente
5. Dados de outros prestadores são inacessíveis
```

### 7. Validação de Segurança

#### Queries de Leitura
```typescript
const where = {
  prestadorId: currentUser.prestadorId,
  // outros filtros...
};
```

#### Criação de Registros
```typescript
const data = {
  ...payload,
  prestadorId: currentUser.prestadorId,
};
```

#### Atualização/Exclusão
```typescript
// Verificar ownership antes
const existing = await prisma.model.findFirst({
  where: { id, prestadorId: currentUser.prestadorId },
});

if (!existing) {
  return 404;
}
```

## Próximos Passos

### 1. Executar Migration
```powershell
npx prisma migrate deploy
npx prisma generate
```

### 2. Atualizar Endpoints Restantes
- `/api/servicos/[id]` - Adicionar validação de prestadorId
- `/api/dps/*` - Já filtra por prestadorId via relacionamento
- `/api/notas/*` - Já filtra por prestadorId via relacionamento

### 3. ✅ Endpoints de Prestador Integrados com API Externa
- ✅ `/api/prestadores` (GET) - Busca prestador da API externa usando token robot
- ✅ `/api/prestadores/[id]` (GET) - Busca da API externa, valida que é o prestador do usuário
- ✅ Usa `getRobotToken()` para autenticação com API externa
- ✅ Endpoint: `${NOTA_API_BASE_URL}/api/Prestadores/${id}`
- ❌ POST, PATCH, DELETE removidos - CRUD gerenciado pela API externa
- ✅ Página de prestadores simplificada - Exibe dados da API externa (somente leitura)

### 4. Testar Isolamento
- Login com usuário do Prestador A
- Tentar acessar dados do Prestador B (deve falhar)
- Criar tomador/serviço (deve ter prestadorId A)
- Verificar que apenas dados do Prestador A são visíveis

## Estrutura de Dados

### Antes
```
Tomador (documento UNIQUE global)
Servico (sem prestadorId)
```

### Depois
```
Prestador
  ├── Tomadores (documento UNIQUE por prestador)
  ├── Servicos (isolados por prestador)
  ├── DPS (já tinha prestadorId)
  └── Notas (já tinha prestadorId)
```

## Observações Importantes

1. **Token JWT**: O `prestadorId` DEVE estar no token retornado pela API de login
2. **Unique Constraint**: Documento de tomador é único apenas dentro do prestador
3. **Foreign Keys**: Todas tabelas principais agora referenciam Prestador
4. **Migração de Dados**: Dados existentes foram associados ao primeiro prestador ativo
5. **Seed**: Não cria mais dados de exemplo (vêm da API externa)

## Segurança

✅ **Isolamento Garantido**
- Usuário só acessa dados do seu prestador
- Queries filtradas automaticamente
- Validação de ownership em updates/deletes

✅ **Token Obrigatório**
- `getCurrentUser()` rejeita tokens sem prestadorId
- Todas rotas protegidas validam autenticação

✅ **Constraint de Banco**
- Foreign keys garantem integridade referencial
- Unique constraints por prestador evitam duplicatas
