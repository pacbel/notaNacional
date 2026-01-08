# TrayApiApp – Manual de Integração (API Local NFS-e Nacional)

Este documento descreve o que o sistema faz, como executar e como integrar via HTTP aos endpoints expostos pela API local. Inclui exemplos de cURL e a descrição dos itens do menu da bandeja (tray).

- Plataforma: .NET 8 (Windows)
- Rede local: HTTP em `https://localhost:5179`
- Codificação: UTF-8
- Autenticação externa (SEFIN): mTLS (Mutual TLS) com certificado ICP-Brasil A1/A4 carregado do Windows Certificate Store, escolhido por thumbprint via header.

Observações importantes:
- Não há uso de JWT ou API Keys para a SEFIN. A autenticação é exclusivamente mTLS.
- A API local exige o header `X-Certificate-Id` (thumbprint) para operações que comunicam com a SEFIN.
- O ambiente deve ser informado por header `X-Ambiente` (1=Produção; 2=Homologação).


## Execução

- Para iniciar a aplicação (interface de bandeja + API local), execute o binário gerado em `bin/Debug/net8.0-windows/TrayApiApp.exe` (ou perfil de publicação).
- A API inicia em `https://localhost:5179` e um ícone surgirá na bandeja do sistema.


## Menus da bandeja (Tray)

- **Abrir Health**: abre `https://localhost:5179/health` no navegador.
- **Abrir Certificados**: abre `https://localhost:5179/certificados` no navegador (lista os certs no Windows Store).
- **Iniciar com o Windows**: ativa/desativa o auto start para o usuário atual.
- **Sair**: encerra a API e remove o ícone da bandeja.


## Logging e armazenamento

- Todas as requisições e respostas são registradas com metadados e conteúdo em `bin/Debug/net8.0-windows/Data/NFSe/logs/` (no perfil Debug).
- O log grava:
  - Corpo bruto do request (quando possível), content-type, content-encoding.
  - Corpo bruto da resposta da SEFIN, content-type e status code.
  - Metadados: ambiente, sufixo do certificado, URL de destino, entre outros.


## Certificados (mTLS)

- O certificado cliente é identificado por thumbprint no header `X-Certificate-Id`.
- Deve existir no repositório Pessoal do Windows (A1/A4) com chave privada disponível.
- Para listar certificados disponíveis via API: `GET /certificados`.

Exemplo para listar e localizar o thumbprint:
```powershell
curl -X GET "https://localhost:5179/certificados"
```


## Convenções de headers

- `X-Certificate-Id`: obrigatório quando houver comunicação com a SEFIN (thumbprint no Windows Store).
- `X-Ambiente`: obrigatório quando houver comunicação com a SEFIN.
  - 1 = Produção
  - 2 = Homologação (Produção restrita)


## Endpoints

### 1) GET `/health`
- Retorna `200 OK` para indicar que a API local está operante.

Exemplo:
```powershell
curl -X GET "https://localhost:5179/health"
```


### 2) GET `/certificados`
- Lista os certificados disponíveis para mTLS (thumbprint, assunto, validade etc.).

Exemplo:
```powershell
curl -X GET "https://localhost:5179/certificados"
```


### 3) GET `/danfse/{chaveAcesso}`
- Obtém o PDF de impressão da NFS-e (DANFSe) a partir da chave de acesso.
- Pode opcionalmente receber certificado por query `?certificateId=` (fallback) ou header `X-Certificate-Id` (preferencial).
- Ambiente por query `?ambiente=1|2` (apenas para este endpoint, conforme implementação atual de impressão via ADN).

Exemplo (homologação, com cert opcional):
```powershell
curl -X GET "https://localhost:5179/danfse/3106..." --output DANFSe.pdf
```


### 4) POST `/assinatura`
- Assina um XML informando a tag alvo usando o certificado indicado.
- Body JSON:
  - `xml`: conteúdo XML a ser assinado (string)
  - `tag`: nome da tag a ser assinada
  - `certificateId`: thumbprint (igual `X-Certificate-Id`)

Exemplo:
```powershell
curl -X POST "https://localhost:5179/assinatura" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  -d "{\"xml\":\"<root>...</root>\",\"tag\":\"infEvento\",\"certificateId\":\"AFD8...\"}"
```

Resposta:
- `200 OK` com o XML assinado (content-type `application/xml`).


### 5) POST `/nfse/emitir`
- Envia a DPS assinada para emissão da NFS-e na SEFIN.
- Headers obrigatórios: `X-Certificate-Id`, `X-Ambiente` não são usados diretamente aqui, pois vêm no body (modelo legado). O endpoint atual lê os campos do body.
- Body JSON esperado:
  - `xmlAssinado`: XML já assinado da DPS
  - `certificateId`: thumbprint do certificado (A1/A4) – obrigatório
  - `ambiente`: 1 ou 2 – obrigatório

Formato de envio para a SEFIN:
- A API converte o `xmlAssinado` para GZip+Base64 (`dpsXmlGZipB64`) e envia JSON conforme a SEFIN.

Exemplo:
```powershell
curl -X POST "https://localhost:5179/nfse/emitir" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  -d "{\"xmlAssinado\":\"<DPS>...</DPS>\",\"certificateId\":\"AFD8...\",\"ambiente\":2}"
```

Resposta:
- `200/201` (dependendo do retorno SEFIN). O corpo pode conter JSON com `nfseXmlGZipB64` (XML da NFS-e compactado em Base64) e outros dados. Em caso de erro, a resposta da SEFIN é repassada como texto.


### 6) POST `/nfse/cancelar`
- Registra o evento de cancelamento para uma NFS-e na SEFIN.
- Autenticação: mTLS via `X-Certificate-Id`.
- Ambiente: `X-Ambiente` (1=Produção; 2=Homologação).
- Body JSON (flexível na entrada):
  - Aceita UM dos formatos abaixo para o conteúdo base64 do XML do evento GZip assinado:
    - `pedidoRegistroEvento.evento`
    - `evento`
    - `eventoXmlGZipB64`
    - `pedidoRegistroEventoXmlGZipB64`
  - `chaveAcesso` (opcional). Se ausente, a API tenta extrair do XML interno.

Formato enviado para a SEFIN:
- Sempre enviado como:
```json
{
  "pedidoRegistroEventoXmlGZipB64": "BASE64_DO_XML_GZIP_ASSINADO"
}
```

URLs SEFIN usadas:
- Homologação: `https://sefin.producaorestrita.nfse.gov.br/SefinNacional/nfse/{chaveAcesso}/eventos`
- Produção: `https://sefin.nfse.gov.br/SefinNacional/nfse/{chaveAcesso}/eventos`

Exemplo (homologação):
```powershell
curl -X POST "https://localhost:5179/nfse/cancelar" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  -H "X-Certificate-Id: AFD8..." ^
  -H "X-Ambiente: 2" ^
  -d "{\"chaveAcesso\":\"31062002205065736000161000000000000525110213973590\",\"pedidoRegistroEventoXmlGZipB64\":\"H4sIAAAAA...\"}"
```

Comportamento e validações:
- `X-Certificate-Id` obrigatório e deve existir no Windows Store com chave privada.
- `X-Ambiente` obrigatório (1 ou 2).
- Se `chaveAcesso` não vier no JSON, a API descompacta e lê o XML do evento para tentar extrair a chave; se não encontrar ou se tamanho ≠ 50, retorna 400.
- Resposta é pass-through da SEFIN (status + corpo + content-type).


## Dicas de Troubleshooting

- **403 da SEFIN**: certificado inválido/expirado/sem chave privada ou CNPJ divergente do prestador.
- **400 local**: body JSON inválido, base64 inválido, gzip inválido, `chaveAcesso` não atende 50 chars e não foi possível extrair do XML.
- **404 SEFIN**: URL incorreta, chave de acesso inexistente no ambiente ou endpoint indisponível.
- Consulte os arquivos em `Data/NFSe/logs/` para o conteúdo do request/response e metadados (ambiente, URL, certSuffix).


## Boas práticas

- Armazenar com segurança o thumbprint do certificado e garantir que o cert esteja instalado com chave privada.
- Homologar sempre com `X-Ambiente: 2` antes de ir a produção.
- Validar previamente (no seu sistema) o conteúdo do XML que será assinado/compactado, quando aplicável. A API local não valida schema ou assinatura — ela apenas transporta com mTLS.


## Exemplos rápidos (PowerShell)

Health:
```powershell
curl -X GET "https://localhost:5179/health"
```

Listar certificados:
```powershell
curl -X GET "https://localhost:5179/certificados"
```

Emitir NFSe (DPS assinada):
```powershell
curl -X POST "https://localhost:5179/nfse/emitir" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  -d "{\"xmlAssinado\":\"<DPS>...</DPS>\",\"certificateId\":\"AFD8...\",\"ambiente\":2}"
```

Cancelar NFSe (evento assinado GZip+Base64):
```powershell
curl -X POST "https://localhost:5179/nfse/cancelar" ^
  -H "Content-Type: application/json; charset=utf-8" ^
  -H "X-Certificate-Id: AFD8..." ^
  -H "X-Ambiente: 2" ^
  -d "{\"chaveAcesso\":\"3106...\",\"pedidoRegistroEventoXmlGZipB64\":\"H4sIAAAAA...\"}"
```

DANFSe (PDF):
```powershell
curl -X GET "https://localhost:5179/danfse/3106..." --output DANFSe.pdf
```


## Suporte

- Em caso de dúvidas ou erros, inclua no chamado: trecho do log de request/response relacionados, ambiente utilizado e o sufixo do certificado (últimos 8 caracteres do thumbprint).
