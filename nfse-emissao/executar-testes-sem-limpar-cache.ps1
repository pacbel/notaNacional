# Script para executar testes Cypress em modo headless
Write-Host "Iniciando a execução dos testes Cypress em modo headless..." -ForegroundColor Cyan

# Configurar variáveis de ambiente para evitar problemas de permissão
$env:CYPRESS_BROWSER = "electron"
$env:ELECTRON_EXTRA_LAUNCH_ARGS = "--no-sandbox"
$env:CYPRESS_NO_SANDBOX = "1"

# Instalar o Cypress (caso ainda não esteja instalado)
Write-Host "Instalando o Cypress e dependências..." -ForegroundColor Yellow
npm install cypress@14.4.0 cypress-file-upload --save-dev

# Executar os testes com Electron em modo headless
Write-Host "Executando os testes em modo headless..." -ForegroundColor Cyan
npx cypress run --browser electron
