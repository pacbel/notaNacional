# Guia de Desenvolvimento Local

Este guia explica como configurar e executar a aplicação API NFSe em um ambiente de desenvolvimento local sem Docker.

## Pré-requisitos

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [MySQL Server 8.0+](https://dev.mysql.com/downloads/mysql/) ou [MariaDB 10.5+](https://mariadb.org/download/)
- [MySQL Workbench](https://www.mysql.com/products/workbench/) ou outra ferramenta de gerenciamento de banco de dados
- [Visual Studio 2022](https://visualstudio.microsoft.com/pt-br/vs/) ou [Visual Studio Code](https://code.visualstudio.com/)

## Configuração do Ambiente

### 1. Configuração do Banco de Dados

1. **Crie um banco de dados** chamado `NFSeDB` no seu servidor MySQL/MariaDB.

2. **Crie um usuário** com as permissões necessárias:
   ```sql
   CREATE USER 'nfse_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON NFSeDB.* TO 'nfse_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 2. Configuração da Aplicação

1. **Atualize o arquivo `appsettings.Development.json`** no projeto `API_NFSe.API` com a string de conexão correta:

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Port=3306;Database=NFSeDB;Uid=nfse_user;Pwd=your_secure_password_here;"
     },
     "Logging": {
       "LogLevel": {
         "Default": "Information",
         "Microsoft.AspNetCore": "Warning",
         "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
       }
     }
   }
   ```

2. **Instale a ferramenta de migração do Entity Framework** (se ainda não estiver instalada):
   ```bash
   dotnet tool install --global dotnet-ef
   ```

## Executando a Aplicação

1. **Navegue até o diretório do projeto da API**:
   ```bash
   cd src/API_NFSe.API
   ```

2. **Aplique as migrações do banco de dados**:
   ```bash
   dotnet ef database update --project ../API_NFSe.Infra.Data
   ```

3. **Execute a aplicação**:
   ```bash
   dotnet run
   ```

4. **Acesse a documentação da API** em: [https://localhost:5001/swagger](https://localhost:5001/swagger) (HTTP) ou [http://localhost:5000/swagger](http://localhost:5000/swagger) (HTTPS)

## Estrutura do Projeto

```
src/
├── API_NFSe.API/           # Camada de API (Controllers, Middlewares)
├── API_NFSe.Application/   # Camada de Aplicação (Serviços, DTOs, Interfaces)
├── API_NFSe.Domain/        # Camada de Domínio (Entidades, Interfaces de Repositório)
└── API_NFSe.Infra.Data/    # Camada de Infraestrutura (Repositórios, Contexto do EF)
```

## Comandos Úteis

- **Criar uma nova migração**:
  ```bash
  dotnet ef migrations add NomeDaMigracao --project src/API_NFSe.Infra.Data --startup-project src/API_NFSe.API
  ```

- **Aplicar migrações pendentes**:
  ```bash
  dotnet ef database update --project src/API_NFSe.Infra.Data --startup-project src/API_NFSe.API
  ```

- **Executar testes**:
  ```bash
  dotnet test
  ```

- **Publicar a aplicação**:
  ```bash
  dotnet publish -c Release -o ./publish
  ```

## Solução de Problemas

- **Erro de conexão com o banco de dados**:
  - Verifique se o servidor MySQL está em execução
  - Confirme se o usuário e senha estão corretos
  - Verifique se o banco de dados foi criado

- **Erro de migração**:
  - Certifique-se de que todas as migrações anteriores foram aplicadas
  - Tente remover a pasta `Migrations` e criar uma nova migração inicial

- **Problemas com certificados HTTPS**:
  - Execute o comando para confiar no certificado de desenvolvimento:
    ```bash
    dotnet dev-certs https --trust
    ```

## Configuração do Ambiente de Desenvolvimento

### Visual Studio Code

1. Instale as extensões recomendadas:
   - C# Dev Kit
   - C# Extensions
   - .NET Core Test Explorer
   - NuGet Package Manager
   - Docker (opcional)

2. Configuração do `launch.json`:
   ```json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": ".NET Core Launch (web)",
         "type": "coreclr",
         "request": "launch",
         "preLaunchTask": "build",
         "program": "${workspaceFolder}/src/API_NFSe.API/bin/Debug/net8.0/API_NFSe.API.dll",
         "args": [],
         "cwd": "${workspaceFolder}/src/API_NFSe.API",
         "stopAtEntry": false,
         "serverReadyAction": {
           "action": "openExternally",
           "pattern": "\\bNow listening on:\\s+(https?://\\S+)"
         },
         "env": {
           "ASPNETCORE_ENVIRONMENT": "Development"
         },
         "sourceFileMap": {
           "/Views": "${workspaceFolder}/Views"
         }
       },
       {
         "name": ".NET Core Attach",
         "type": "coreclr",
         "request": "attach"
       }
     ]
   }
   ```

### Visual Studio 2022

1. Abra o arquivo de solução `API_NFSe.sln`
2. Defina o projeto `API_NFSe.API` como projeto de inicialização
3. Configure o perfil de inicialização para usar o ambiente de desenvolvimento
4. Pressione F5 para iniciar a depuração

## Próximos Passos

- [ ] Configurar autenticação e autorização
- [ ] Implementar testes unitários e de integração
- [ ] Configurar CI/CD
- [ ] Configurar monitoramento e logging
- [ ] Documentar a API com mais detalhes

## Suporte

Em caso de dúvidas ou problemas, entre em contato com a equipe de desenvolvimento.
