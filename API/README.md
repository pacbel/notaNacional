# API NFSe

API para gerenciamento de Notas Fiscais de Serviço Eletrônicas (NFSe) desenvolvida em .NET 8.

## 📋 Requisitos

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Docker](https://www.docker.com/products/docker-desktop) (opcional, para execução em container)
- MySQL 8.0+ ou Docker para o banco de dados

## 🚀 Como executar

### 1. Configuração do Ambiente

1. Faça um clone do repositório:
   ```bash
   git clone https://github.com/seu-usuario/API_NFSe.git
   cd API_NFSe
   ```

2. Crie um arquivo `.env` na raiz do projeto baseado no arquivo `.env.example` e configure as variáveis de ambiente necessárias.

### 2. Configuração do Banco de Dados

#### Usando Docker (recomendado):

```bash
docker run --name nfse-db -e MYSQL_ROOT_PASSWORD=your_secure_password -e MYSQL_DATABASE=NFSeDB -p 3306:3306 -d mysql:8.0
```

#### Ou instalação manual:

1. Instale o MySQL 8.0+
2. Crie um banco de dados chamado `NFSeDB`
3. Atualize a string de conexão no arquivo `appsettings.json`

### 3. Executando a Aplicação

1. Navegue até o diretório do projeto:
   ```bash
   cd src/API_NFSe.API
   ```

2. Restaure os pacotes NuGet:
   ```bash
   dotnet restore
   ```

3. Execute as migrações do banco de dados:
   ```bash
   dotnet ef database update --project ../API_NFSe.Infra.Data
   ```

4. Inicie a aplicação:
   ```bash
   dotnet run
   ```

5. Acesse a documentação da API em: [http://localhost:5000/swagger](http://localhost:5000/swagger)

## 🛠️ Estrutura do Projeto

```
API_NFSe/
├── src/
│   ├── API_NFSe.API/           # Camada de API (Controllers, Middlewares)
│   ├── API_NFSe.Application/   # Camada de Aplicação (Serviços, DTOs, Interfaces)
│   ├── API_NFSe.Domain/        # Camada de Domínio (Entidades, Interfaces de Repositório)
│   └── API_NFSe.Infra.Data/    # Camada de Infraestrutura (Repositórios, Contexto do EF)
├── tests/                      # Testes unitários e de integração
├── .env.example                # Exemplo de variáveis de ambiente
└── README.md                   # Este arquivo
```

## 🔧 Tecnologias Utilizadas

- .NET 8.0
- Entity Framework Core 8.0
- MySQL 8.0+
- AutoMapper
- Swagger/OpenAPI
- Docker (opcional)

## 📚 Documentação da API

A documentação da API está disponível através do Swagger em:
- [http://localhost:5000/swagger](http://localhost:5000/swagger)

### Principais Endpoints

- `GET /api/prestadores/{prestadorId}/bilhetagem/saldo` – Retorna o saldo de créditos disponível para emissão (200). Possíveis erros:
  - 400 com `{ mensagem: "Prestador inválido." }` quando o identificador for malformado;
  - 403 quando o usuário não tiver permissão para o prestador informado.
- `GET /api/prestadores/{prestadorId}/bilhetagem/lancamentos?limite=50` – Lista os créditos/débitos aplicados (200) com as mesmas regras de erro acima.
- `POST /api/prestadores/{prestadorId}/bilhetagem/creditos` – Adiciona créditos manuais (200). Retorna 400 com `{ mensagem: "A quantidade de créditos deve ser maior que zero." }` quando aplicável, além dos cenários de 403 descritos acima.
- `POST /api/nfse/emitir` – Inicia o processo de emissão de NFSe, abatendo um crédito quando houver bilhetagem ativa.

> **Mensagem de negócio padrão:** quando o saldo é consumido totalmente, os endpoints de emissão retornam erro com `"Saldo de emissões insuficiente para gerar uma nova NFSe."`.

## 🧪 Executando os Testes

```bash
dotnet test
```

## 📦 Implantação

### Publicando a aplicação

```bash
dotnet publish -c Release -o ./publish
```

### Usando Docker

1. Construa a imagem:
   ```bash
   docker build -t api-nfse .
   ```

2. Execute o container:
   ```bash
   docker run -d -p 5000:80 --name api-nfse-container api-nfse
   ```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✉️ Contato

Seu Nome - [@seu_twitter](https://twitter.com/seu_twitter) - email@exemplo.com

Link do Projeto: [https://github.com/seu-usuario/API_NFSe](https://github.com/seu-usuario/API_NFSe)
