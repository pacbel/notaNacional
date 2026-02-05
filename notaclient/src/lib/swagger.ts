export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "NotaClient Public API",
    version: "1.0.0",
    description: "Documentação da API pública do NotaClient",
  },
  tags: [
    {
      name: "Public",
      description: "Endpoints públicos para integração externa",
    },
  ],
  components: {
    securitySchemes: {
      basicAuth: {
        type: "http",
        scheme: "basic",
      },
    },
    schemas: {
      PublicTomadorCreate: {
        type: "object",
        required: [
          "prestadorId",
          "tipoDocumento",
          "documento",
          "nomeRazaoSocial",
          "email",
          "codigoMunicipio",
          "cidade",
          "estado",
          "cep",
          "logradouro",
          "numero",
          "bairro",
        ],
        properties: {
          prestadorId: { type: "string", format: "uuid" },
          tipoDocumento: { type: "string", enum: ["CPF", "CNPJ"] },
          documento: { type: "string", description: "Apenas números" },
          nomeRazaoSocial: { type: "string" },
          email: { type: "string", format: "email" },
          telefone: { type: "string", nullable: true },
          inscricaoMunicipal: { type: "string", nullable: true },
          codigoMunicipio: { type: "string", pattern: "^\\d{7}$" },
          cidade: { type: "string" },
          estado: { type: "string", pattern: "^[A-Z]{2}$" },
          cep: { type: "string", pattern: "^\\d{8}$" },
          logradouro: { type: "string" },
          numero: { type: "string" },
          complemento: { type: "string", nullable: true },
          bairro: { type: "string" },
        },
      },
      PublicDpsCreate: {
        type: "object",
        required: ["prestadorId", "servicoId", "competencia", "dataEmissao"],
        properties: {
          prestadorId: { type: "string", format: "uuid" },
          tomadorId: { type: "string", format: "uuid", nullable: true },
          servicoId: { type: "string", format: "uuid" },
          competencia: { type: "string", format: "date-time" },
          dataEmissao: { type: "string", format: "date-time" },
          tipoEmissao: { type: "integer", minimum: 0, maximum: 9 },
          tomadorNaoIdentificado: { type: "boolean", description: "Informe true quando não houver tomador identificado", default: false },
          observacoes: { type: "string", nullable: true },
        },
      },
      PublicTomadorWithDps: {
        type: "object",
        required: ["tomador", "dps"],
        properties: {
          tomador: { $ref: "#/components/schemas/PublicTomadorCreate" },
          dps: {
            allOf: [
              { $ref: "#/components/schemas/PublicDpsCreate" },
              {
                type: "object",
                properties: {
                  tomadorId: { readOnly: true, nullable: true },
                },
              },
            ],
          },
        },
      },
      PublicProcessDps: {
        type: "object",
        required: ["prestadorId"],
        properties: {
          prestadorId: { type: "string", format: "uuid" },
          dpsIds: {
            type: "array",
            items: { type: "string", format: "uuid" },
            minItems: 1,
            nullable: true,
            description: "Lista opcional de DPS a processar. Quando omitido, o sistema processa todas as DPS do prestador elegíveis.",
          },
          certificateId: { type: "string", nullable: true },
          ambiente: { type: "integer", minimum: 1, maximum: 2, nullable: true },
          tag: { type: "string", nullable: true },
        },
      },
      PublicProcessDpsResponse: {
        type: "array",
        items: {
          type: "object",
          required: ["dpsId", "steps"],
          properties: {
            dpsId: { type: "string", format: "uuid" },
            steps: {
              type: "array",
              items: {
                type: "object",
                required: ["step", "success"],
                properties: {
                  step: { type: "string", enum: ["assinatura", "emissao"] },
                  success: { type: "boolean" },
                  response: { description: "Resposta bruta do processamento quando disponível" },
                  error: {
                    type: "object",
                    nullable: true,
                    properties: {
                      message: { type: "string" },
                      statusCode: { type: "integer", nullable: true },
                      details: { nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  security: [{ basicAuth: [] }],
  paths: {
    "/api/public/tomadores": {
      post: {
        tags: ["Public"],
        summary: "Cria um novo tomador",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicTomadorCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tomador criado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
          "409": { description: "Documento já cadastrado" },
        },
      },
    },
    "/api/public/dps": {
      post: {
        tags: ["Public"],
        summary: "Cria uma DPS para um tomador existente",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicDpsCreate" },
            },
          },
        },
        responses: {
          "201": {
            description: "DPS criada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
          "404": { description: "Relacionamento inexistente" },
        },
      },
    },
    "/api/public/tomadores-com-dps": {
      post: {
        tags: ["Public"],
        summary: "Cria tomador e DPS em uma única chamada",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicTomadorWithDps" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tomador e DPS criados",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    tomadorId: { type: "string", format: "uuid" },
                    dpsId: { type: "string", format: "uuid" },
                  },
                },
              },
            },
          },
          "400": { description: "Dados inválidos" },
        },
      },
    },
    "/api/public/processar-dps": {
      post: {
        tags: ["Public"],
        summary: "Processa DPS (assinatura e emissão)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PublicProcessDps" },
            },
          },
        },
        responses: {
          "200": {
            description: "Resultado do processamento das DPS",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PublicProcessDpsResponse" },
              },
            },
          },
          "400": { description: "Dados inválidos" },
          "404": { description: "DPS não encontrada para o prestador" },
        },
      },
    },
  },
} as const;

export function getSwaggerSpec() {
  return swaggerSpec;
}
