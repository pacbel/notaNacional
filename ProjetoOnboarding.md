## 1. Visão geral do cenário atual
- Cadastro de prestadores (frontend) usa `prestadorSchema` com validações e integração via `criarPrestador` para `/api/prestadores` @src/app/prestadores/page.tsx#65-1408, @src/services/prestadores.ts#24-56.  
- Cadastro de usuários administrativos depende de prestador pré-existente e das validações de senha forte @src/app/usuarios/page.tsx#133-418, @src/types/usuarios.ts#12-26.  
- API expõe serviços para criação de prestadores, usuários e robot clients com regras de autorização (`Administrador`) @API/src/API_NFSe.API/Controllers/PrestadoresController.cs#228-269, @API/src/API_NFSe.API/Controllers/RobotClientsController.cs#11-238.  
- Camada de aplicação consolida as regras de domínio para prestador, usuários e clientes robóticos @API/src/API_NFSe.Application/Services/PrestadorService.cs#71-101, @API/src/API_NFSe.Application/Services/UsuarioService.cs#78-139, @API/src/API_NFSe.Application/Services/RobotClientService.cs#32-187.  
- Autenticação atual exige MFA e relaciona usuários a prestadores (@API/src/API_NFSe.Application/Services/AuthService.cs#50-348), o que reforça a necessidade de provisionar dados corretos no onboarding.

## 2. Objetivo do onboarding automático
Criar uma rota pública em formato de wizard que:
1. Colete dados de prestador, usuário administrador inicial e robô.
2. Persista tudo em sequência transacional (base principal e base “client” com mesmo esquema).
3. Opcionalmente importe um XML de exemplo para configurar parâmetros iniciais.
4. Finalize habilitando o acesso imediato (tokens, senhas provisórias ou instruções de login).

## 3. Experiência do wizard (frontend)
### Estrutura
- Rota pública `/onboarding` (Next.js App Router).  
- Wizard com 5 etapas:  
  1. **Dados gerais do prestador** (CNPJ, razão social, endereço).  
  2. **Configurações fiscais/operacionais mínimas** (SMTP básico, créditos iniciais se obrigatório).  
  3. **Usuário administrador** (nome, e-mail, senha/confirmar senha).  
  4. **Robô client** (nome, geração automática de clientId e secret, escopos).  
  5. **Importação opcional de XML** (upload, pré-validação, resumo).  

### Comportamento
- Persistir estado no client (React Hook Form + Zustand ou context) e permitir navegação entre etapas.
- Validações alinhadas aos schemas existentes (`prestadorSchema`, `userSchema`, requisitos de robot client).  
- Exibir resumo final com dados sensíveis parcialmente mascarados (ex.: secret do robô mostrado uma vez).
- Preparar feedback visual para falhas de API por etapa (uso de mutation hooks específicos).

## 4. Ajustes necessários no backend
### Nova rota pública
- Criar endpoint REST (ex.: `POST /api/public/onboarding`) sem autenticação, protegido por rate limit e CAPTCHA/CSRF.
- Endpoint orquestra:
  1. Criação do prestador (`PrestadorService.CriarAsync`).
  2. Criação do usuário administrador (`UsuarioService.CriarAsync`) associado ao prestador recém-criado.
  3. Criação do robot client (`RobotClientService.CriarAsync`) com retorno do secret gerado.
  4. Gravação opcional do XML (ver seção 6).

### Transação única
- Implementar serviço orquestrador aplicacional:
  - Injeção de `DbContext` principal e `DbContext` da base “client” (nome distinto, mesmas credenciais).
  - Uso de `IDbContextTransaction` ou `TransactionScope` abrangendo ambas as bases; se não viável, desenhar compensações (ex.: rollback manual).
- Validar pré-existência (CNPJ, e-mail, clientId) antes de persistir para evitar conflitos.

### Segurança
- Sanitizar entradas (CNPJ apenas dígitos, e-mails em minúsculo, escape de strings).
- Audit trail: registrar IP/origem do onboarding em logs.
- Proteção contra abuso: throttling baseado em IP/domínio + reCAPTCHA ou solução similar antes do submit final.
- Notificação opcional por e-mail ao novo administrador com instruções de login (usar configuração SMTP default ou fallback da plataforma).

## 5. Integração com a base “client”
- Identificar contexto do nome diferente (ex.: `notaNacionalClient`).  
- Criar repositório/serviço dedicado para replicar prestador/usuário/robot client. Se estruturas divergirem, mapear campo a campo.
- Garantir sincronia de senhas/hash (BCrypt) e IDs (usar GUIDs gerados antecipadamente para replicar).
- Se existirem jobs/robôs que leem essa base, validar consistência da replicação antes de ativar.

## 6. Importação opcional de XML
- Frontend: upload na etapa 5, validação de extensão, tamanho e leitura do conteúdo.
- Backend: endpoint recebe arquivo, parseia (usar builder existente que gera XML para NFSe, adaptar para análise reversa ou alimentar configuradores).
- Objetivo: extrair parâmetros (ex.: naturezas de operação, itens de serviço, códigos tributários) e configurar registros padrão (ex.: create default service entries).  
- Necessário definir regras de fallback se XML inválido; armazenar no bucket/pasta do prestador para referência.

## 7. Governança e permissões
- Usuário criado deve receber role `Administrador` (role memory) para acesso total.
- Robot client com scopes mínimos necessários (ex.: emissão automática). Documentar no resumo final.
- Considerar política de senha inicial: gerar senha forte automática enviada por e-mail ou permitir escolha no wizard com validação.

## 8. Testes e qualidade
- Cobertura unitária para serviço de onboarding (mock repositórios) + integração com DB em memória.
- Testes e2e do wizard (Playwright) validando fluxos feliz e erros.
- Testar importação de XML com arquivos válidos e inválidos.
- Performance: simular múltiplos onboards para avaliar locking/transação cruzada.

## 9. Observabilidade e suporte
- Log estruturado (prestadorId, emailAdmin, clientId gerado).
- Métricas (contador de onboardings, tempo médio por etapa).
- Alertas em caso de falhas na replicação ou importação.

## 10. Roadmap sugerido
1. **Descoberta técnica** (2-3 dias): confirmar esquemas das duas bases, requisitos do XML, dependências de onboarding (certificados?).
2. **API orquestradora** (4-5 dias): implementar serviço, transações, validações, testes.
3. **Wizard frontend** (5-7 dias): UI, integrações, UX, estado, resumo.
4. **Importação XML** (3-4 dias): parser, storage, automações.
5. **Segurança & observabilidade** (2 dias): rate limit, logs, métricas.
6. **QA & ajustes finais** (3 dias): e2e, UAT com case real.
7. **Rollout controlado**: liberar em ambiente de staging, validar com equipe interna antes de produção.

## 11. Próximos passos recomendados
1. Detalhar formato do XML e regras de configuração automática desejadas.
2. Validar com infraestrutura como será exposta a nova rota pública (firewall, rate limiting).
3. Definir estratégia de envio de MFA inicial ou bypass para primeiro login do administrador.

Este plano cobre a análise dos módulos existentes e propõe a implantação do onboarding passo a passo, garantindo replicação de dados, segurança e experiência de usuário consistente.