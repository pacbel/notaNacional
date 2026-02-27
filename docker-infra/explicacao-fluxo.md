# Explicação do Fluxo de Deploy

## Visão Geral
O sistema utiliza CI/CD com GitHub Actions para deploy automático em dois ambientes: Produção (branch `main`) e Homologação (branch `homolog`). O deploy é baseado em Docker Compose com Traefik como reverse proxy.

## Fluxo de Deploy Automático

1. **Push no Repositório**
   - Desenvolvedor faz push na branch `main` ou `homolog`

2. **GitHub Actions Acionado**
   - Workflow `deploy.yml` é executado no runner Ubuntu
   - Detecta a branch e define variáveis de ambiente:
     - `main` → ENVIRONMENT=prod, SERVER_DIR=/srv/prod
     - `homolog` → ENVIRONMENT=homolog, SERVER_DIR=/srv/homolog

3. **Build das Imagens**
   - Login no GitHub Container Registry (GHCR)
   - Build de 4 imagens Docker:
     - Landing Page (nginx)
     - App Notanacional (Next.js)
     - Notanacional Hub (Next.js)
     - API .NET
   - Push das imagens para GHCR com tags: `latest` e `sha`

4. **Deploy no Servidor**
   - Conexão SSH no servidor Ubuntu
   - Navega para o diretório do ambiente
   - Executa `docker-compose pull` para baixar imagens atualizadas
   - Executa `docker-compose up -d --build` para atualizar containers

## Roteamento com Traefik

- Traefik escuta portas 80/443
- Certificados SSL automáticos via Let's Encrypt
- Roteamento baseado em Host header:
  - `notanacional.virtual.app.br` → Landing
  - `app.notanacional.virtual.app.br` → App Notanacional
  - `notanacional-hub.virtual.app.br` → Notanacional Hub
  - `notanacional-hub-api.virtual.app.br` → API .NET

## Segurança

- Firewall UFW permite apenas SSH (22), HTTP (80), HTTPS (443)
- MySQL não exposto externamente
- Certificados SSL obrigatórios
- Variáveis sensíveis em arquivos .env

## Deploy Manual

- Para deploy manual, usar script `deploy.sh`
- Executar no servidor: `./deploy.sh prod` ou `./deploy.sh homolog`
- Útil para testes ou rollback

## Monitoramento

- Healthchecks configurados em todos containers
- Logs disponíveis via `docker-compose logs`
- Status dos serviços via `docker-compose ps`
