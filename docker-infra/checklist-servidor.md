# Checklist de Configuração Inicial do Servidor Ubuntu 22.04

## 1. Atualizar sistema
sudo apt update && sudo apt upgrade -y

## 2. Instalar Docker e Docker Compose
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release -y
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

## 3. Configurar Docker para executar sem sudo
sudo usermod -aG docker $USER
newgrp docker

## 4. Instalar UFW (Firewall)
sudo apt install ufw -y
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

## 5. Criar estrutura de pastas
sudo mkdir -p /srv/prod/app-data/mysql/data /srv/prod/app-data/certs /srv/prod/app-data/uploads /srv/prod/logs
sudo mkdir -p /srv/homolog/app-data/mysql/data /srv/homolog/app-data/certs /srv/homolog/app-data/uploads /srv/homolog/logs

## 6. Criar rede Docker externa
docker network create web

## 7. Copiar arquivos de configuração
# Copie docker-compose.prod.yml para /srv/prod/
# Copie docker-compose.homolog.yml para /srv/homolog/
# Copie .env.prod para /srv/prod/.env
# Copie .env.homolog para /srv/homolog/.env

## 8. Configurar permissões
sudo chown -R $USER:$USER /srv/prod /srv/homolog

## Configurar Docker Hub

1. **Criar conta no Docker Hub** (se não tiver):
   - Acesse https://hub.docker.com
   - Crie conta gratuita

2. **Criar repositório**:
   - Clique em "Create Repository"
   - Nome: `notanacional` (minúsculo)
   - Visibilidade: Public (ou Private se preferir)
   - Clique em "Create"

3. **Gerar Access Token**:
   - Vá em Account Settings > Security
   - Clique em "New Access Token"
   - Nome: `notanacional-deploy`
   - Permissões: Read, Write, Delete
   - Copie o token gerado (única vez que aparece!)

- **`SERVER_HOST`**: IP/domínio do servidor
- **`SERVER_USER`**: Usuário SSH (ex: ubuntu)
- **`SERVER_SSH_KEY`**: Chave privada SSH completa
- **`DOCKERHUB_USERNAME`**: Seu username no Docker Hub (ex: `pacbel`)
- **`DOCKERHUB_TOKEN`**: O token gerado acima (não use senha da conta)

## 10. Primeiro deploy
# Execute manualmente ou aguarde push na branch
cd /srv/prod
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
