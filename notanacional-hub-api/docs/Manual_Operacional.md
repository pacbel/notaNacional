# Manual Operacional - API NFSe

## 1. Visão Geral
A API possui recursos para integração com os serviços NFSe (assinatura, emissão, cancelamento e download de DANFSe), além de auditoria persistente em banco e testes automatizados cobrindo os fluxos críticos. Este guia descreve como configurar, executar e monitorar essas funcionalidades, bem como entender o pipeline de CI configurado.

## 2. Pré-requisitos
- Windows com PowerShell.
- SDK .NET 9.0 instalado.
- Acesso a um banco MySQL compatível com a connection string `DefaultConnection` configurada em `appsettings.json`.
- Certificados digitais válidos instalados no Windows (repositórios CurrentUser e/ou LocalMachine) para operações NFSe reais.

## 3. Configuração Inicial
1. Clonar o repositório e abrir o diretório raiz (`API_NFSe`).
2. Configurar as variáveis de ambiente (certificados, banco, JWT) conforme `README.md` e `appsettings.json`.
3. Restaurar dependências e aplicar migrações:
   ```powershell
   dotnet restore API_NFSe.sln
   dotnet ef database update --project src\API_NFSe.Infra.Data\API_NFSe.Infra.Data.csproj --startup-project src\API_NFSe.API\API_NFSe.API.csproj
   ```

## 4. Execução Local
Para executar a API:
```powershell
dotnet run --project src\API_NFSe.API\API_NFSe.API.csproj
```
Endpoints principais expostos em `NfseController` (`/api/nfse`):
- `GET /certificados` – lista certificados disponíveis.
- `POST /assinatura` – assina XML (payload: `SignXmlRequestDto`).
- `POST /emitir` – emite NFSe (payload: `EmitirNfseRequestDto`).
- `POST /cancelar` – cancela NFSe (payload: `CancelarNfseRequestDto`).
- `GET /danfse/{chave}` – baixa DANFSe (query: ambiente e certificateId). Recomenda-se autenticar via JWT antes das chamadas.

## 5. Logs e Auditoria
- Middleware `AuditLoggingMiddleware` registra, para cada requisição autenticada, usuário, rota, método, status e payload (limite 4 KB).
- Tabela `AuditLogs` armazena os registros; campos como `UsuarioNome`, `Email` e `Ip` são opcionais para evitar falhas caso as claims não estejam presentes.
- Em caso de falha ao registrar, o middleware captura as exceções e apenas loga no console.

## 6. Testes Automatizados
Projeto de testes: `tests/API_NFSe.Tests`.
- Framework: xUnit.
- Bibliotecas de apoio: FluentAssertions, Moq, coverlet (coletor de cobertura).
- Áreas cobertas:
  - `NfseSefinServiceTests` – assinatura, emissão, cancelamento, download de DANFSe.
  - `CertificateStoreServiceTests` – listagem e busca de certificados usando store fake.
  - `AuditLoggingMiddlewareTests` – captura de payload e registro em `IAuditLogger`.

Para executar:
```powershell
dotnet test API_NFSe.sln --no-build --configuration Release --collect:"XPlat Code Coverage"
```
Relatórios de cobertura são gerados em `TestResults/<guid>/coverage.cobertura.xml`.

## 7. Pipeline de CI
Arquivo: `.github/workflows/ci.yml`.
- Dispara em *push* e *pull request* para `main` e `develop`.
- Passos:
  1. Checkout do código (`actions/checkout`).
  2. Instalação do .NET 9 (`actions/setup-dotnet`).
  3. `dotnet restore` da solução.
  4. `dotnet build` (Release).
  5. `dotnet test` com coleta de cobertura.
  6. Publicação dos artefatos de cobertura (`coverage.cobertura.xml`) usando `actions/upload-artifact`.
- Em caso de falha em qualquer etapa, o pipeline sinaliza o erro no GitHub.

## 8. Troubleshooting
- **Falhas de assinatura NFSe**: verificar se o certificado possui chave privada e se o thumbprint foi informado corretamente.
- **Erros de conexão MySQL**: garantir que a string de conexão e credenciais no `appsettings.json` estejam corretas e que o servidor esteja acessível.
- **CI falhando no `dotnet test`**: rodar localmente com `dotnet test` para reproduzir; conferir se novas dependências foram adicionadas ao projeto de testes.
- **Logs não aparecem**: checar se a migration `AddAuditLogs` foi aplicada e se há acessos autenticados para gerar registros.
- **Cobertura vazia**: confirmar se o teste foi executado com `--collect:"XPlat Code Coverage"` e se o pacote `coverlet.collector` permanece referenciado.

## 9. Boas Práticas
- Manter testes atualizados ao introduzir endpoints ou regras de negócio.
- Validar coberturas mínimas dentro do pipeline (pode ser configurado futuramente com `coverlet` ou ferramentas como Sonar/Codecov).
- Evitar rastrear dados sensíveis no payload do log; use máscaras se necessário.
- Planejar rotinas de retenção/apagamento para a tabela `AuditLogs` conforme políticas da empresa.

---
Em caso de dúvidas adicionais, consulte os arquivos-fonte mencionados ou entre em contato com a equipe responsável pela integração NFSe.
