Implementar fluxo “client credentials” (usuário robótico) consumindo POST /api/auth/robot-token:

1. Guardar CLIENT_ID/CLIENT_SECRET em variáveis de ambiente seguras (process.env) e só usar no backend (Route Handler / Server Action).
2. Criar função server-side que faça POST JSON para /api/auth/robot-token com { clientId, clientSecret, scope }.
3. Cachear o access_token no backend com expiração = response.expiraEm (usar cache in-memory ou KV). Renovar automaticamente antes de expirar.
4. Usar o token apenas em chamadas server-to-server; nunca expor ao browser.
5. Monitorar falhas e alertas (status 401/403) para detectar segredo expirado/comprometido.
6. Preparar rotação de segredo via atualização das variáveis + flush do cache.