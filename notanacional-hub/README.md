# Frontend NFSe Hub

Aplicação Next.js para consumo da API NFSe (.NET 8). O frontend implementa autenticação com MFA, painel operacional, CRUDs completos e fluxos NFSe (assinatura, emissão, cancelamento e download DANFSe) usando React Query, React Hook Form, Zod e Tailwind.

## Requisitos

- Node.js 20+
- npm 10+
- Variáveis de ambiente:
  - `NEXT_PUBLIC_API_BASE_URL` (URL base da API NFSe)

## Instalação

```bash
npm install
```

## Scripts importantes

| Script | Descrição |
| ------ | --------- |
| `npm run lint` | Executa ESLint |
| `npm run test` | Executa testes unitários (Vitest + Testing Library) |
| `npm run start` | Inicia app em modo produção (necessita build prévio) |

> ⚠️ **Importante:** conforme instruções do projeto, não utilize `npm run dev` ou `npm run build` neste momento. Use apenas `npm run start` após ter o build gerado externamente caso necessário.

## Arquitetura

- `src/app`: rotas do Next.js (App Router)
  - `/login`, `/forgot-password`, `/reset-password`
  - `/dashboard`, `/usuarios`, `/prestadores`, `/dps`, `/robot-clients`
  - `/nfse/*` (certificados, assinatura, emissão, cancelamento, download)
- `src/contexts`: contextos (ex.: `AuthProvider`)
- `src/services`: wrappers HTTP (fetch) por domínio
- `src/types`: contratos alinhados aos DTOs da API
- `src/hooks`: hooks customizados (`useApiQuery`, `useApiMutation`)
- `src/components`: UI base (botões, inputs, tabelas, layout)
- `tests`: cobertura de hooks e utilitários

## Fluxos suportados

- Autenticação: login com MFA, refresh automático, recuperação e reset de senha.
- Users: CRUD completo, troca de senha, associação opcional a prestadores.
- Prestadores: cadastro/edição, configuração fiscal (ambiente, URLs, certificado padrão).
- DPS: filtros, criação, detalhamento, paginação.
- Clientes Robóticos: criação/edição, ativação/inativação, rotação de secret.
- NFSe: listar certificados, assinar XML, emitir NFSe, cancelar NFSe, baixar DANFSe.

## Testes

Foi configurado Vitest com ambiente `jsdom` e suporte a path aliases (`vite-tsconfig-paths`). Exemplos:

```bash
npm run test
```

## Estilo e design system

- Tailwind CSS com tokens de cor e tipografia em `globals.css`.
- Componentes reutilizáveis (Button, Input, Table, Card, Pagination, StatsCard etc.).
- Layout com sidebar recolhível e header dinâmico (roles, menu usuário, toasts via Sonner).

## Observações

- A aplicação usa armazenamento local para tokens (`nfse.auth.tokens`).
- `services/http.ts` inclui refresh automático e tratamento de erros padronizado.
- Todos os feedbacks ao usuário são exibidos via toasts (`sonner`).
