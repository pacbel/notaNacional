# Teste Local da Infraestrutura Docker

## Pré-requisitos

1. **Windows 11 com WSL2 habilitado**
2. **Docker Desktop instalado** (com integração WSL2)
3. **Git** instalado no WSL

## Passos para Teste

### 1. Abrir WSL
```bash
wsl
```

### 2. Navegar para o projeto
```bash
cd /mnt/c/Drive/Google/Pacbel/projetoNotaNacional
```

### 3. Verificar Docker
```bash
docker --version
docker-compose --version
```

### 4. Construir e iniciar serviços
```bash
# Usar docker-compose.local.yml para teste sem Traefik
docker-compose -f docker-compose.local.yml --env-file .env.local up --build -d
```

### 5. Verificar status
```bash
docker-compose -f docker-compose.local.yml ps
```

### 6. Acessar aplicações
- **Landing Page**: http://localhost:8080
- **App Notanacional**: http://localhost:3001
- **Notanacional Hub**: http://localhost:3002
- **API .NET**: http://localhost:5000

### 7. Verificar logs
```bash
# Logs de todos os serviços
docker-compose -f docker-compose.local.yml logs -f

# Logs de um serviço específico
docker-compose -f docker-compose.local.yml logs app-notanacional
```

### 8. Parar serviços
```bash
docker-compose -f docker-compose.local.yml down
```

### 9. Limpar volumes (se necessário)
```bash
docker-compose -f docker-compose.local.yml down -v
```

## Notas Importantes

- **MySQL**: Porta 3306 exposta para desenvolvimento
- **Database**: Conexão usa `host.docker.internal` para acessar MySQL do host
- **Volumes**: Dados do MySQL persistidos em volume Docker
- **Hot Reload**: Para desenvolvimento, monte volumes dos códigos fonte

## Troubleshooting

- **Erro de conexão MySQL**: Aguarde o healthcheck completar (~30s)
- **Portas ocupadas**: Mude as portas no docker-compose.local.yml
- **Permissões**: Execute como usuário normal (não root)
- **Windows Firewall**: Permita Docker Desktop

## Desenvolvimento com Hot Reload

Para desenvolvimento, adicione volumes no docker-compose.local.yml:

```yaml
app-notanacional:
  build: ...
  volumes:
    - ./app-notanacional:/app
    - /app/node_modules
  # ... resto da config
```
