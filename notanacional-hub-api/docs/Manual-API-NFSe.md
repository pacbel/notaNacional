# Manual de Uso da API NFSe

Este manual apresenta, de forma simples e didática, como utilizar os principais recursos da API NFSe. Todas as chamadas seguem o padrão HTTPS e retornam dados em formato JSON (exceto quando indicado).

> **Importante:** Para acessar a maioria dos recursos é preciso possuir um token de acesso válido. As seções abaixo explicam como obtê-lo.

## Índice

1. [Autenticação e segurança](#autenticação-e-segurança)
   - Login com MFA
   - Confirmação do código MFA
   - Renovação de token
   - Autenticação de robôs
   - Revogação de sessão
   - Esqueci minha senha
   - Redefinir senha
2. [Gestão de usuários](#gestão-de-usuários)
   - Listagem
   - Detalhes por usuário
   - Criação
   - Atualização
   - Troca de senha
   - Remoção
3. [Gestão de prestadores](#gestão-de-prestadores)
   - Listagem
   - Detalhes
   - Criação
   - Atualização
   - Remoção
   - Configuração
4. [DPS (Declarações)](#dps-declarações)
   - Consulta geral
   - Consulta por ID
   - Criação
5. [Clientes robóticos](#clientes-robóticos)
   - Listagem
   - Detalhes
   - Criação
   - Atualização
   - Inativação / Reativação
   - Troca de segredo
6. [NFSe - Assinaturas e certificados](#nfse---assinaturas-e-certificados)
   - Listagem de certificados
   - Assinatura de XML
7. [Anexos](#anexos)
   - Convenções de resposta
   - Exemplo de cabeçalho de autenticação

---

## Autenticação e segurança

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Login | `POST /api/auth/login` | POST | Não | Inicia o processo de login com segundo fator. |
| Confirmar código MFA | `POST /api/auth/confirm-mfa` | POST | Não | Confirma o código recebido por e-mail e entrega os tokens. |
| Renovar token | `POST /api/auth/refresh` | POST | Não | Gera um novo par de tokens a partir do refresh token. |
| Token para robôs | `POST /api/auth/robot-token` | POST | Não | Disponibiliza um token de acesso exclusivo para integrações automatizadas. |
| Revogar sessão | `POST /api/auth/revoke` | POST | Sim | Encerra o refresh token informado. |
| Esqueci minha senha | `POST /api/auth/forgot-password` | POST | Não | Envia e-mail com instruções de redefinição. |
| Redefinir senha | `POST /api/auth/reset-password` | POST | Não | Aplica a nova senha usando o token enviado por e-mail. |

### Como funciona o login com MFA
1. Envie email e senha para `/api/auth/login`.
2. Receba a mensagem confirmando o envio do código de verificação.
3. Informe o código recebido em `/api/auth/confirm-mfa` para receber o **Access Token** e o **Refresh Token**.

### Sobre tokens
- **Access Token**: utilizado no cabeçalho `Authorization: Bearer {token}`. Possui tempo curto de validade.
- **Refresh Token**: serve para renovar o acesso em `/api/auth/refresh` sem passar novamente pelo MFA.

### Autenticação de robôs
Utilize `/api/auth/robot-token` informando `clientId`, `clientSecret` e os escopos desejados. O retorno é um Access Token com permissões limitadas aos escopos concedidos ao cliente robótico.

---

## Gestão de usuários
> Disponível apenas para perfis com papel **Administrador**.

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Listar usuários | `GET /api/usuarios` | GET | Administrador | Mostra todos os usuários cadastrados. |
| Detalhar usuário | `GET /api/usuarios/{id}` | GET | Administrador | Exibe informações de um usuário específico. |
| Criar usuário | `POST /api/usuarios` | POST | Administrador | Cadastra um novo usuário humano. |
| Atualizar usuário | `PUT /api/usuarios/{id}` | PUT | Administrador | Atualiza nome, e-mail, papel e prestador associado. |
| Trocar senha | `PUT /api/usuarios/{id}/senha` | PUT | Administrador | Define uma nova senha para o usuário informado. |
| Remover usuário | `DELETE /api/usuarios/{id}` | DELETE | Administrador | Remove o usuário da plataforma. |

**Observação:** Usuários do tipo "Robot" são criados pela área de clientes robóticos (ver seção específica).

---

## Gestão de prestadores

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Listar prestadores | `GET /api/prestadores` | GET | Administrador (todos) / Gestão e Operação (somente próprio) | Mostra prestadores conforme escopo do usuário. |
| Detalhar prestador | `GET /api/prestadores/{id}` | GET | Administrador / Gestão / Operação (apenas prestador vinculado) | Exibe dados completos de um prestador. |
| Criar prestador | `POST /api/prestadores` | POST | Administrador | Cadastra um novo prestador. |
| Atualizar prestador | `PUT /api/prestadores/{id}` | PUT | Administrador / Gestão (somente próprio) | Atualiza dados cadastrais do prestador. |
| Remover prestador | `DELETE /api/prestadores/{id}` | DELETE | Administrador | Exclui o prestador e seus vínculos. |
| Ver configuração | `GET /api/prestadores/{id}/configuracao` | GET | Administrador / Gestão / Operação (somente próprio) | Consulta dados de configuração (ambiente, séries, URLs). |
| Definir configuração | `PUT /api/prestadores/{id}/configuracao` | PUT | Administrador / Gestão (somente próprio) | Ajusta a configuração padrão de emissão do prestador. |

**Acesso:**
- **Administrador**: acesso total a todos os prestadores.
- **Gestão**: acesso somente ao prestador associado com permissão de edição.
- **Operação**: acesso somente ao prestador associado com permissão apenas de leitura.

---

## DPS (Declarações)

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Listar DPS | `GET /api/prestadores/{prestadorId}/dps` | GET | Administrador (todos) / Gestão e Operação (somente prestador vinculado) | Lista DPS por prestador, com filtros opcionais por status e datas. |
| Detalhar DPS | `GET /api/prestadores/{prestadorId}/dps/{dpsId}` | GET | Administrador / Gestão / Operação (somente prestador vinculado) | Exibe os detalhes de uma declaração específica. |
| Criar DPS | `POST /api/prestadores/{prestadorId}/dps` | POST | Administrador / Gestão / Operação (somente prestador vinculado) | Registra uma nova declaração. |

**Dicas:**
- Utilize os filtros `status`, `dataInicio` e `dataFim` para localizar declarações específicas.
- Ao criar, verifique o retorno: ele inclui o identificador (`dpsId`) para consultas futuras.

---

## Clientes robóticos

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Listar clientes | `GET /api/prestadores/{prestadorId}/robot-clients` | GET | Administrador | Exibe os robôs ativos do prestador. |
| Detalhar cliente | `GET /api/prestadores/{prestadorId}/robot-clients/{id}` | GET | Administrador | Traz informações completas de um robô. |
| Criar cliente | `POST /api/prestadores/{prestadorId}/robot-clients` | POST | Administrador | Cria um novo robô e define o segredo inicial. |
| Atualizar cliente | `PUT /api/prestadores/{prestadorId}/robot-clients/{id}` | PUT | Administrador | Ajusta nome, clientId, escopos e status do robô. |
| Inativar cliente | `DELETE /api/prestadores/{prestadorId}/robot-clients/{id}` | DELETE | Administrador | Desativa o robô (não apaga). |
| Reativar cliente | `POST /api/prestadores/{prestadorId}/robot-clients/{id}/reativar` | POST | Administrador | Reativa um robô previamente inativado. |
| Trocar segredo | `POST /api/prestadores/{prestadorId}/robot-clients/{id}/rotate-secret` | POST | Administrador | Define um novo `clientSecret`. |

**Fluxo sugerido:**
1. Crie o robô informando nome, `clientId`, segredo e escopos.
2. Compartilhe com segurança o `clientSecret` com o time técnico.
3. O robô usa `/api/auth/robot-token` para obter tokens temporários.
4. Utilize as rotas de inativação e rotação de segredo sempre que precisar bloquear ou renovar acessos.

---

## NFSe - Assinaturas e certificados

| Recurso | Caminho | Método | Autenticação | Descrição |
|---------|---------|--------|--------------|-----------|
| Listar certificados | `GET /api/nfse/certificados` | GET | Administrador / Gestão / Operação / Robot | Mostra os certificados disponíveis para assinatura. |
| Assinar XML | `POST /api/nfse/assinatura` | POST | Administrador / Gestão / Operação / Robot | Recebe um XML, assina o arquivo e devolve o conteúdo assinado. |
| Emitir NFSe | `POST /api/nfse/emitir` | POST | Administrador / Gestão / Operação / Robot | Submete a NFSe para emissão. |
| Cancelar NFSe | `POST /api/nfse/cancelar` | POST | Administrador / Gestão / Operação / Robot | Solicita o cancelamento de uma NFSe emitida. |
| Download DANFSe | `GET /api/nfse/danfse/{chave}` | GET | Administrador / Gestão / Operação / Robot | Recupera o DANFSe associado à chave informada. |

**Assinatura de XML:**
- Informe o conteúdo do XML em texto, a tag a ser assinada e o identificador do certificado.
- O retorno é um XML assinado pronto para ser transmitido ao município.
- Todas as operações exigem que o usuário esteja autenticado; o identificador é registrado em logs de auditoria para rastreabilidade.

---

## Perfis de acesso

- **Administrador**: recebe privilégios completos em todos os módulos (usuários, prestadores, configurações, DPS, NFSe e clientes robóticos).
- **Gestão**: pode operar somente sobre o prestador vinculado, com permissão de edição de dados/configurações e acesso aos módulos de DPS e NFSe.
- **Operação**: acesso somente leitura ao prestador vinculado, podendo consumir os módulos de DPS e NFSe para consultas ou envios que não alterem cadastros.
- **Robot**: perfil técnico para integrações automatizadas, limitado aos escopos associados ao cliente robótico.

---

## Anexos

### Convenções de resposta
- **200 OK**: requisição bem-sucedida.
- **201 Created**: recurso criado com sucesso.
- **204 No Content**: operação concluída, sem conteúdo adicional.
- **400 Bad Request**: dados de entrada inválidos.
- **401 Unauthorized / 403 Forbidden**: falta de autenticação ou permissão insuficiente.
- **404 Not Found**: recurso não localizado.

### Exemplo de cabeçalho com Access Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Boas práticas gerais
- Proteja seus tokens. Nunca compartilhe o `clientSecret` ou o `refreshToken` em canais inseguros.
- Utilize HTTPS em todas as chamadas.
- Sempre trate respostas de erro exibindo mensagens amigáveis aos usuários finais.
- Atualize periodicamente segredos e senhas.

### Ferramentas de apoio
- **Manual interativo**: disponível em `https://localhost:7020/docs/manual` (interface Redoc gerada automaticamente).
- **Coleção Insomnia**: importe o arquivo `docs/Insomnia-API-NFSe.json` para testar rapidamente todos os endpoints.

---

Com este guia, você tem um passo a passo completo para operar a API NFSe de maneira segura e eficiente. Para dúvidas adicionais, entre em contato com o time responsável pela integração.
