# Sistema de Renovação Automática de Token

## Visão Geral

O sistema agora possui renovação automática de token JWT quando recebe erro 401 (Não autorizado).

## Como Funciona

1. **Interceptor de Requisições**: O utilitário `fetchWithAuth` intercepta todas as requisições HTTP
2. **Detecção de 401**: Quando recebe status 401, tenta renovar a sessão automaticamente
3. **Renovação de Token**: Chama o endpoint `/api/auth/refresh` para renovar o cookie de sessão
4. **Retry Automático**: Após renovar, repete a requisição original
5. **Redirecionamento**: Se a renovação falhar, redireciona para a página de login

## Uso

### Em Serviços do Cliente

Substitua `fetch` por `fetchWithAuth`:

```typescript
// ANTES
const response = await fetchWithAuth("/api/configuracoes", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});

// DEPOIS
import { fetchWithAuth } from "@/lib/fetch-with-auth";

const response = await fetchWithAuth("/api/configuracoes", {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
});
```

### Desabilitar Retry (Opcional)

Se você não quer que uma requisição específica tente renovar o token:

```typescript
const response = await fetchWithAuth("/api/some-endpoint", {
  method: "GET",
  skipAuthRetry: true, // Não tenta renovar em caso de 401
});
```

## Arquivos Modificados

1. **`src/lib/fetch-with-auth.ts`** - Utilitário principal com lógica de retry
2. **`src/app/api/auth/refresh/route.ts`** - Endpoint para renovar sessão
3. **`src/components/configuracoes/configuracoes-service.ts`** - Exemplo de uso

## Próximos Passos

Para aplicar em outros serviços, substitua `fetch` por `fetchWithAuth` nos seguintes arquivos:

- `src/services/nfse.ts`
- `src/services/prestadores.ts`
- `src/services/usuarios.ts`
- `src/services/tomadores.ts`
- `src/services/servicos.ts`
- Qualquer outro serviço que faça requisições HTTP

## Observações

- O sistema usa o cookie `nota_session` para autenticação
- O token é gerenciado pela API externa NotaNacional
- A renovação apenas estende a validade do cookie, não gera novo token JWT
- Se o token JWT já expirou, a renovação falhará e o usuário será redirecionado para login
