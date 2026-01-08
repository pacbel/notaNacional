# Script para executar os testes Cypress
Write-Host "Iniciando a execução dos testes Cypress..." -ForegroundColor Cyan

# Instalar o Cypress e dependências
Write-Host "Instalando o Cypress e dependências..." -ForegroundColor Yellow
npm install cypress@14.4.0 cypress-file-upload --save-dev

# Definir variáveis de ambiente para evitar problemas de permissão
$env:CYPRESS_BROWSER = "electron"
$env:ELECTRON_EXTRA_LAUNCH_ARGS = "--no-sandbox"
$env:CYPRESS_NO_SANDBOX = "1"

# Verificar se o servidor está rodando
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "Servidor detectado na porta 3000." -ForegroundColor Green
    }
} catch {
    Write-Host "Servidor não detectado na porta 3000." -ForegroundColor Yellow
}

# Iniciar o servidor se não estiver rodando
if (-not $serverRunning) {
    Write-Host "Iniciando o servidor em segundo plano..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow
    
    # Aguardar o servidor iniciar
    Write-Host "Aguardando o servidor iniciar (15 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

# Executar o Cypress com o Electron
Write-Host "Iniciando o Cypress..." -ForegroundColor Cyan
npx cypress open --browser electron

Write-Host "Cypress finalizado." -ForegroundColor Green
