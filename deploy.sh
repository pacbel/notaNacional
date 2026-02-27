#!/bin/bash

# Script de deploy manual para produção ou homologação
# Uso: ./deploy.sh prod ou ./deploy.sh homolog

set -e

ENVIRONMENT=$1

if [ "$ENVIRONMENT" != "prod" ] && [ "$ENVIRONMENT" != "homolog" ]; then
  echo "Uso: $0 prod|homolog"
  exit 1
fi

if [ "$ENVIRONMENT" = "prod" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
  SERVER_DIR="/srv/prod"
else
  COMPOSE_FILE="docker-compose.homolog.yml"
  SERVER_DIR="/srv/homolog"
fi

echo "Deploying to $ENVIRONMENT..."

cd "$SERVER_DIR"

# Pull latest images
docker-compose -f "$COMPOSE_FILE" pull

# Build and start services
docker-compose -f "$COMPOSE_FILE" up -d --build

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 30

# Check status
docker-compose -f "$COMPOSE_FILE" ps

echo "Deploy completed successfully!"
